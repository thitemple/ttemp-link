<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_SHORTLINK_BASE_URL } from "$env/static/public";
	import ShareLinkModal from "$lib/components/ShareLinkModal.svelte";
	import { getLinkById } from "$lib/model/link/queries.remote";
	import {
		addTag,
		deleteLinkCommand,
		removeTag,
		updateLinkForm,
	} from "$lib/model/link/mutations.remote";

	type TagMutationResult = {
		ok: boolean;
		tags: string[];
		message?: string;
	};

	const linkId = $derived(page.params.id!);
	const linkData = $derived(await getLinkById({ id: linkId }));

	const base = (PUBLIC_SHORTLINK_BASE_URL ?? "").replace(/\/+$/, "");
	const shortUrl = $derived.by(() =>
		base ? `${base}/${linkData.link.slug}` : `/${linkData.link.slug}`,
	);
	const hostname = $derived.by(() => {
		try {
			return new URL(linkData.link.destinationUrl).hostname;
		} catch {
			return "Destination";
		}
	});
	const titleText = $derived.by(() => linkData.link.title ?? "untitled");
	const isTitleTruncated = $derived.by(() => titleText.length > 50);
	const truncatedTitleText = $derived.by(() => {
		return isTitleTruncated ? titleText.slice(0, 50) + "..." : titleText;
	});
	const displayTitle = $derived.by(() => `${hostname} — ${truncatedTitleText}`);
	const fullTitle = $derived.by(() => `${hostname} — ${titleText}`);
	const formatDateTime = (value: string | number | Date | null | undefined) => {
		if (!value) return "";
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return "";
		try {
			return new Intl.DateTimeFormat(undefined, {
				dateStyle: "long",
				timeStyle: "short",
				timeZoneName: "short",
			}).format(date);
		} catch {
			try {
				return date.toLocaleString();
			} catch {
				return date.toISOString();
			}
		}
	};
	const createdAtLabel = $derived.by(() => formatDateTime(linkData.link.createdAt));
	const toFiniteNumber = (value: unknown) => {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	};

	const lastRangeClicks = $derived.by(() => toFiniteNumber(linkData.stats?.lastRangeClicks));
	const previousRangeClicks = $derived.by(() =>
		toFiniteNumber(linkData.stats?.previousRangeClicks),
	);
	const weeklyChange = $derived.by(() => {
		if (previousRangeClicks <= 0) {
			return lastRangeClicks > 0 ? 100 : 0;
		}
		const change = ((lastRangeClicks - previousRangeClicks) / previousRangeClicks) * 100;
		return Number.isFinite(change) ? Math.round(change) : 0;
	});
	const weeklyChangeLabel = $derived.by(() => `${weeklyChange > 0 ? "+" : ""}${weeklyChange}%`);
	const toDisplayTags = (value: unknown) => {
		if (!Array.isArray(value)) return [];
		return value.filter((tag): tag is string => typeof tag === "string");
	};

	let copiedUrl = $state("");
	const isCopied = $derived.by(() => copiedUrl !== "" && copiedUrl === shortUrl);
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;
	let isShareOpen = $state(false);
	let didAutoOpenShareModal = $state(false);
	let isEditOpen = $state(false);
	let tagInput = $state("");
	let tagMessage = $state("");
	let tagError = $state("");
	const sourceTags = $derived.by(() => toDisplayTags(linkData.link.tags));
	let tags = $state<string[]>([]);
	let didInitTags = $state(false);
	const isTagMutating = $derived.by(() => addTag.pending > 0 || removeTag.pending > 0);
	let isDeleting = $state(false);

	const copyShortUrl = async () => {
		if (!shortUrl) return;
		try {
			await navigator.clipboard.writeText(shortUrl);
			copiedUrl = shortUrl;
			if (copyTimeout) {
				clearTimeout(copyTimeout);
			}
			copyTimeout = setTimeout(() => {
				copiedUrl = "";
				copyTimeout = null;
			}, 2000);
		} catch {
			copiedUrl = "";
		}
	};

	const openShare = () => {
		isShareOpen = true;
	};

	const closeShare = () => {
		isShareOpen = false;
	};

	const toggleEdit = () => {
		isEditOpen = !isEditOpen;
	};

	const updateIssues = $derived.by(() => updateLinkForm.fields?.allIssues() ?? []);
	const destinationIssues = $derived.by(
		() => updateLinkForm.fields?.destination?.issues() ?? [],
	);
	const slugIssues = $derived.by(() => updateLinkForm.fields?.slug?.issues() ?? []);

	const applyTagResult = (result: TagMutationResult) => {
		tags = result.tags;
		if (result.ok) {
			tagError = "";
			tagMessage = result.message ?? "Tags saved.";
			return;
		}

		tagMessage = "";
		tagError = result.message ?? "Unable to save tags.";
	};

	const addTagFromInput = async () => {
		if (isTagMutating) return;
		if (!tagInput.trim()) return;

		tagMessage = "";
		tagError = "";

		try {
			const result = await addTag({ linkId: linkData.link.id, tag: tagInput });
			applyTagResult(result);
			if (result.ok) {
				tagInput = "";
			}
		} catch {
			tagMessage = "";
			tagError = "Unable to save tag right now.";
		}
	};

	const handleTagInputKeydown = (event: KeyboardEvent) => {
		if (event.key !== "Enter") return;
		event.preventDefault();
		event.stopPropagation();
	};

	const handleTagInput = async () => {
		if (isTagMutating) return;
		if (!/\s/.test(tagInput)) return;
		await addTagFromInput();
	};

	const removeExistingTag = async (tag: string) => {
		if (isTagMutating) return;

		tagMessage = "";
		tagError = "";

		try {
			const result = await removeTag({ linkId: linkData.link.id, tag });
			applyTagResult(result);
		} catch {
			tagMessage = "";
			tagError = "Unable to remove tag right now.";
		}
	};

	const handleDelete = async () => {
		if (isDeleting) return;
		isDeleting = true;
		try {
			await deleteLinkCommand({ linkId: linkId });
			goto("/links");
		} catch {
			isDeleting = false;
		}
	};

	$effect(() => {
		if (didInitTags) return;
		tags = sourceTags;
		didInitTags = true;
	});

	$effect(() => {
		if (didAutoOpenShareModal) return;
		if (page.url.searchParams.get("created") !== "1") return;
		didAutoOpenShareModal = true;
		isShareOpen = true;
	});

	$effect(() => {
		updateLinkForm.fields.linkId.set(linkId);
	});
</script>

<svelte:boundary>
	<section class="grid min-w-0 gap-6">
		<div class="brutal-card p-6">
			<div class="flex min-w-0 flex-wrap items-start justify-between gap-4">
				<div class="flex min-w-0 flex-1 flex-wrap items-start gap-4">
					<div
						class="grid h-12 w-12 place-items-center rounded-2xl border-2 border-black bg-white text-lg font-semibold"
					>
						{hostname.slice(0, 2).toUpperCase()}
					</div>
					<div class="min-w-0 flex-1">
						<div class={isTitleTruncated ? "group relative" : ""}>
							<p class="truncate text-3xl font-semibold" class:cursor-help={isTitleTruncated}>
								{displayTitle}
							</p>
							{#if isTitleTruncated}
								<div
									class="pointer-events-none absolute top-full left-0 z-50 mt-2 max-w-2xl scale-95 rounded-xl border-2 border-black bg-white p-4 text-base font-semibold opacity-0 shadow-[4px_4px_0px_#000] transition-all duration-200 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100"
								>
									{fullTitle}
								</div>
							{/if}
						</div>
						<div class="mt-2 flex flex-wrap items-center gap-3 text-sm">
							<a
								class="font-semibold text-primary-600 hover:underline"
								href={shortUrl}
								target="_blank"
								rel="noreferrer"
							>
								{shortUrl}
							</a>
							<button
								class="grid h-8 w-8 place-items-center rounded-lg border-2 border-black bg-white text-xs font-semibold shadow-[2px_2px_0px_#000]"
								type="button"
								onclick={copyShortUrl}
								aria-label="Copy short link"
							>
								{isCopied ? "✓" : "⧉"}
							</button>
						</div>
						<div class="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
							<span class="inline-flex items-center gap-2">
								<span class="text-base">↪</span>
								<span class="break-all">{linkData.link.destinationUrl}</span>
							</span>
						</div>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<details class="relative">
						<summary
							class="grid h-11 w-11 cursor-pointer place-items-center rounded-xl border-2 border-black bg-white text-xl shadow-[3px_3px_0px_#000]"
							aria-label="Open link actions"
						>
							⋯
						</summary>
						<div
							class="absolute top-12 right-0 z-20 min-w-[160px] rounded-xl border-2 border-black bg-white p-3 shadow-[4px_4px_0px_#000]"
						>
							<button
								class="w-full text-left text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
								type="button"
								onclick={handleDelete}
								disabled={isDeleting}
							>
								Delete link
							</button>
						</div>
					</details>
					<button
						class="grid h-11 w-11 place-items-center rounded-xl border-2 border-black bg-white text-xl shadow-[3px_3px_0px_#000]"
						type="button"
						onclick={toggleEdit}
						aria-expanded={isEditOpen}
						aria-label="Edit link"
					>
						✎
					</button>
					<button
						class="brutal-button-secondary flex items-center gap-2"
						type="button"
						onclick={openShare}
					>
						<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M18 8a3 3 0 1 0-2.8-4H15a3 3 0 0 0 .2 1.1L8.7 9.1a3 3 0 1 0 0 5.8l6.5 4a3 3 0 1 0 1-1.6l-6.6-4.1a3 3 0 0 0 0-2.4l6.6-4.1A3 3 0 0 0 18 8z"
							/>
						</svg>
						Share
					</button>
				</div>
			</div>

			<div class="mt-6 border-t-2 border-black/10 pt-4">
				<div class="flex flex-wrap items-start justify-between gap-4">
					<div class="flex-1">
						<div class="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
							<span class="text-base">🏷</span>
							<span>Tags</span>
						</div>

						<div class="mt-3 rounded-xl border-2 border-black bg-white p-2">
							<div class="flex flex-wrap items-center gap-2">
								{#each tags as tag (tag)}
									<span
										class="inline-flex items-center gap-2 rounded-full border-2 border-black bg-primary px-3 py-1 text-xs font-semibold tracking-wide uppercase"
									>
										<span>{tag}</span>
										<button
											class="grid h-5 w-5 place-items-center rounded-full border border-black bg-white text-[10px] leading-none"
											type="button"
											onclick={() => removeExistingTag(tag)}
											disabled={isTagMutating}
											aria-label={`Remove ${tag} tag`}
										>
											×
										</button>
									</span>
								{/each}
								<input
									class="h-8 min-w-[220px] flex-1 border-0 bg-transparent text-sm font-semibold outline-none"
									placeholder="Type a tag and hit space"
									bind:value={tagInput}
									oninput={handleTagInput}
									onkeydown={handleTagInputKeydown}
									disabled={isTagMutating}
									aria-label="Add tag"
								/>
							</div>
						</div>
						{#if tags.length === 0}
							<p class="mt-2 text-sm text-[var(--muted)]">No tags yet. Type and press space.</p>
						{/if}

						{#if tagError}
							<p class="mt-2 text-sm font-semibold text-red-700">{tagError}</p>
						{:else if tagMessage}
							<p class="mt-2 text-sm font-semibold text-[var(--muted)]">{tagMessage}</p>
						{/if}
					</div>

					<span class="pt-1 text-sm text-[var(--muted)]">{createdAtLabel}</span>
				</div>
			</div>
		</div>

		<div class="grid gap-4 md:grid-cols-3">
			<div class="brutal-card p-5">
				<p class="text-sm text-[var(--muted)]">Engagements</p>
				<p class="mt-2 text-3xl font-semibold">{linkData.link.totalClicks}</p>
			</div>
			<div class="brutal-card p-5">
				<p class="text-sm text-[var(--muted)]">Last 7 days</p>
				<p class="mt-2 text-3xl font-semibold">{lastRangeClicks}</p>
			</div>
			<div class="brutal-card p-5">
				<p class="text-sm text-[var(--muted)]">Weekly change</p>
				<p class="mt-2 text-3xl font-semibold">{weeklyChangeLabel}</p>
			</div>
		</div>

		{#if isEditOpen}
			<div class="brutal-card p-6">
				<h3 class="text-xl font-semibold">Edit link</h3>
				<p class="mt-2 text-sm text-[var(--muted)]">Update destination, slug, or status.</p>

				{#each updateIssues as issue (issue.message)}
					<div class="mt-5 border-2 border-black bg-primary px-4 py-3 text-sm font-semibold">
						{issue.message}
					</div>
				{/each}

				{#if updateLinkForm.result?.success}
					<div class="mt-5 border-2 border-black bg-emerald-100 px-4 py-3 text-sm font-semibold">
						Link updated successfully.
					</div>
				{/if}

				<form
					{...updateLinkForm}
					class="mt-6 grid gap-4 md:grid-cols-2"
					data-sveltekit-preload-data="off"
				>
					<input {...updateLinkForm.fields.linkId.as("hidden", linkId)} />

					<label class="flex flex-col gap-2 text-sm font-semibold md:col-span-2">
						<span>Destination URL</span>
						{#each destinationIssues as issue (issue.message)}
							<span class="text-xs text-red-600">{issue.message}</span>
						{/each}
						<input
							class="brutal-input"
							required
							{...updateLinkForm.fields.destination.as("url")}
							value={linkData.link.destinationUrl}
						/>
					</label>

					<label class="flex flex-col gap-2 text-sm font-semibold">
						<span>Title (optional)</span>
						<input
							class="brutal-input"
							{...updateLinkForm.fields.title.as("text")}
							value={linkData.link.title ?? ""}
						/>
					</label>

					<label class="flex flex-col gap-2 text-sm font-semibold">
						<span>Slug</span>
						{#each slugIssues as issue (issue.message)}
							<span class="text-xs text-red-600">{issue.message}</span>
						{/each}
						<input
							class="brutal-input"
							{...updateLinkForm.fields.slug.as("text")}
							value={linkData.link.slug}
						/>
					</label>

					<label class="flex items-center gap-3 text-sm font-semibold">
						<input
							class="h-4 w-4"
							{...updateLinkForm.fields.isActive.as("checkbox")}
							checked={linkData.link.isActive}
						/>
						<span>Active</span>
					</label>

					<div class="flex flex-wrap gap-3 md:col-span-2">
						<button class="brutal-button" type="submit">Save changes</button>
						<a class="brutal-button-secondary" href="/links">Back to links</a>
					</div>
				</form>
			</div>
		{/if}
	</section>

	{#snippet pending()}
		<div class="flex items-center justify-center py-12">
			<p class="text-sm text-[var(--muted)]">Loading link details...</p>
		</div>
	{/snippet}

	{#snippet failed(error, reset)}
		<div class="brutal-card p-6 text-center">
			<p class="text-sm text-red-700">Failed to load link details. Please try again.</p>
			<button class="brutal-button-secondary mt-4" onclick={reset}>Retry</button>
		</div>
	{/snippet}
</svelte:boundary>

<ShareLinkModal
	open={isShareOpen}
	url={shortUrl}
	linkId={linkData.link.id}
	heading="Your link is ready!"
	subheading="Copy the link below to share it or choose a platform to share it to."
	onClose={closeShare}
/>
