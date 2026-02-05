import { PUBLIC_SHORTLINK_BASE_URL } from "$env/static/public";
import { fail } from "@sveltejs/kit";
import { deleteLink, listLinks } from "@ttemp/db/queries";

export async function load() {
	const links = await listLinks();

	return {
		links,
		shortBaseUrl: PUBLIC_SHORTLINK_BASE_URL,
	};
}

export const actions = {
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = String(data.get("id") ?? "").trim();

		if (!id) {
			return fail(400, { message: "Link id is required." });
		}

		await deleteLink(id);
		return { success: true };
	},
};
