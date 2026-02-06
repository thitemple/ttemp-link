import { command, form, getRequestEvent } from "$app/server";
import { error, invalid } from "@sveltejs/kit";
import { createLink as createLinkRecord, findLinkById, updateLink } from "@ttemp/db/queries";
import * as v from "valibot";
import { resolveCreateSlug } from "$lib/server/link-create";
import { normalizeTag, normalizeTags, validateTagLimits } from "$lib/server/link-tags";
import { normalizeDestinationUrl } from "$lib/server/link-utils";
import { fetchPageTitle } from "$lib/server/link-metadata";

const createLinkSchema = v.object({
	destination: v.string(),
	slug: v.optional(v.string()),
	title: v.optional(v.string()),
});

const tagCommandSchema = v.object({
	linkId: v.string(),
	tag: v.string(),
});

type TagMutationResult = {
	ok: boolean;
	tags: string[];
	message?: string;
};

type DatabaseError = {
	code?: string;
	constraint?: string;
	constraint_name?: string;
	cause?: unknown;
};

const areTagsEqual = (left: string[], right: string[]) =>
	left.length === right.length && left.every((value, index) => value === right[index]);

const asDatabaseError = (value: unknown): DatabaseError | null =>
	typeof value === "object" && value !== null ? (value as DatabaseError) : null;

const resolveDatabaseError = (value: unknown): DatabaseError | null => {
	const directError = asDatabaseError(value);
	if (!directError) return null;
	const nestedError = asDatabaseError(directError.cause);
	return nestedError ?? directError;
};

const resolveConstraintName = (error: DatabaseError | null) =>
	error?.constraint ?? error?.constraint_name ?? "";

const requireOwnedLink = async (linkId: string) => {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		error(401, "You must be signed in to update tags.");
	}

	const link = await findLinkById(linkId);
	if (!link) {
		error(404, "Link not found.");
	}

	if (link.createdBy !== locals.user.id) {
		error(403, "You do not have access to this link.");
	}

	return link;
};

export const createLink = form(createLinkSchema, async (data, issue) => {
	const { locals } = getRequestEvent();
	const user = locals.user;

	if (!user) {
		invalid("You must be signed in to create links.");
	}

	const destinationInput = data.destination.trim();
	const rawSlug = (data.slug ?? "").trim();
	const titleInput = (data.title ?? "").trim();

	const destinationUrl = normalizeDestinationUrl(destinationInput);
	if (!destinationUrl) {
		invalid(issue.destination("Destination URL must be a valid http(s) address."));
	}

	const slugResult = await resolveCreateSlug(rawSlug);
	if (!slugResult.ok) {
		invalid(issue.slug(slugResult.message));
	}

	const fetchedTitle = titleInput === "" ? await fetchPageTitle(destinationUrl) : null;
	const title = titleInput === "" ? fetchedTitle : titleInput;

	const record = await (async () => {
		try {
			return await createLinkRecord({
				slug: slugResult.slug,
				destinationUrl,
				title: title === "" ? null : title,
				createdBy: user.id,
			});
		} catch (createError) {
			const databaseError = resolveDatabaseError(createError);
			const constraintName = resolveConstraintName(databaseError);

			if (databaseError?.code === "23505" && constraintName === "links_slug_unique") {
				invalid(issue.slug("This slug is already in use."));
			}

			if (databaseError?.code === "23503") {
				invalid("Your session is out of date. Sign out and sign in again.");
			}

			throw createError;
		}
	})();

	if (!record) {
		invalid("Unable to create the short link. Please try again.");
	}

	return {
		message: "Link created successfully.",
		createdSlug: slugResult.slug,
		createdId: record.id,
	};
});

export const addTag = command(
	tagCommandSchema,
	async ({ linkId, tag }): Promise<TagMutationResult> => {
		const link = await requireOwnedLink(linkId);
		const currentTags = normalizeTags(link.tags ?? []);
		const normalizedTag = normalizeTag(tag);

		if (!normalizedTag) {
			return {
				ok: false,
				tags: currentTags,
				message: "Tag cannot be empty.",
			};
		}

		const nextTags = normalizeTags([...currentTags, normalizedTag]);
		const validation = validateTagLimits(nextTags);
		if (!validation.ok) {
			return {
				ok: false,
				tags: currentTags,
				message: validation.message,
			};
		}

		if (areTagsEqual(currentTags, nextTags)) {
			return {
				ok: true,
				tags: currentTags,
				message: "Tag already exists.",
			};
		}

		await updateLink(link.id, { tags: nextTags });
		return { ok: true, tags: nextTags };
	},
);

export const removeTag = command(
	tagCommandSchema,
	async ({ linkId, tag }): Promise<TagMutationResult> => {
		const link = await requireOwnedLink(linkId);
		const currentTags = normalizeTags(link.tags ?? []);
		const normalizedTag = normalizeTag(tag);

		if (!normalizedTag) {
			return {
				ok: false,
				tags: currentTags,
				message: "Tag cannot be empty.",
			};
		}

		const nextTags = currentTags.filter((existingTag) => existingTag !== normalizedTag);
		const validation = validateTagLimits(nextTags);
		if (!validation.ok) {
			return {
				ok: false,
				tags: currentTags,
				message: validation.message,
			};
		}

		if (areTagsEqual(currentTags, nextTags)) {
			return {
				ok: true,
				tags: currentTags,
				message: "Tag not found.",
			};
		}

		await updateLink(link.id, { tags: nextTags });
		return { ok: true, tags: nextTags };
	},
);
