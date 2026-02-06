<script lang="ts">
	import { page } from "$app/stores";
	import ShareLinkModal from "$lib/components/ShareLinkModal.svelte";
	import { addTag, removeTag } from "$lib/model/link/mutations.remote";

	let { data, form } = $props();

	type TagMutationResult = {
		ok: boolean;
		tags: string[];
		message?: string;
	};

	const base = $derived.by(() => (data.shortBaseUrl ?? "").replace(/\/+$/, ""));
	const shortUrl = $derived.by(() => (base ? `${base}/${data.link.slug}` : `/${data.link.slug}`));
	const hostname = $derived.by(() => {
		try {
			return new URL(data.link.destinationUrl).hostname;
		} catch (error) {
			return "Destination";
		}
	});
	const titleText = $derived.by(() => data.link.title ?? "untitled");
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
		} catch (error) {
			try {
				return date.toLocaleString();
			} catch (fallbackError) {
				return date.toISOString();
			}
		}
	};
	const createdAtLabel = $derived.by(() => formatDateTime(data.link.createdAt));
	const toFiniteNumber = (value: unknown) => {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	};

	const lastRangeClicks = $derived.by(() => toFiniteNumber(data.stats?.lastRangeClicks));
	const previousRangeClicks = $derived.by(() => toFiniteNumber(data.stats?.previousRangeClicks));
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
	const sourceTags = $derived.by(() => toDisplayTags(data.link.tags));
	let tags = $state<string[]>([]);
	let didInitTags = $state(false);
	const isTagMutating = $derived.by(() => addTag.pending > 0 || removeTag.pending > 0);

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
		} catch (error) {
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

	const formValues = $derived.by(
		() => (form as { values?: Record<string, string | boolean> } | undefined)?.values ?? {},
	);
	const formIsActive = $derived.by(() => {
		const value = formValues.isActive;
		if (typeof value === "boolean") return value;
		if (typeof value === "string") {
			return value === "on" || value === "true";
		}
		return undefined;
	});

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
			const result = await addTag({ linkId: data.link.id, tag: tagInput });
			applyTagResult(result);
			if (result.ok) {
				tagInput = "";
			}
		} catch (error) {
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
			const result = await removeTag({ linkId: data.link.id, tag });
			applyTagResult(result);
		} catch (error) {
			tagMessage = "";
			tagError = "Unable to remove tag right now.";
		}
	};

	$effect(() => {
		if (didInitTags) return;
		tags = sourceTags;
		didInitTags = true;
	});

	$effect(() => {
		if (didAutoOpenShareModal) return;
		if ($page.url.searchParams.get("created") !== "1") return;
		didAutoOpenShareModal = true;
		isShareOpen = true;
	});
</script>

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
							<span class="break-all">{data.link.destinationUrl}</span>
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
						<form method="POST" action="?/delete" data-sveltekit-preload-data="off">
							<button
								class="w-full text-left text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
								type="submit"
							>
								Delete link
							</button>
						</form>
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
			<p class="mt-2 text-3xl font-semibold">{data.link.totalClicks}</p>
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

			{#if form?.message}
				<div class="mt-5 border-2 border-black bg-primary px-4 py-3 text-sm font-semibold">
					{form.message}
				</div>
			{/if}

			<form
				method="POST"
				action="?/update"
				class="mt-6 grid gap-4 md:grid-cols-2"
				data-sveltekit-preload-data="off"
			>
				<label class="flex flex-col gap-2 text-sm font-semibold md:col-span-2">
					<span>Destination URL</span>
					<input
						class="brutal-input"
						name="destination"
						required
						value={formValues.destination ?? data.link.destinationUrl}
					/>
				</label>

				<label class="flex flex-col gap-2 text-sm font-semibold">
					<span>Title (optional)</span>
					<input
						class="brutal-input"
						name="title"
						value={formValues.title ?? data.link.title ?? ""}
					/>
				</label>

				<label class="flex flex-col gap-2 text-sm font-semibold">
					<span>Slug</span>
					<input class="brutal-input" name="slug" value={formValues.slug ?? data.link.slug} />
				</label>

				<label class="flex items-center gap-3 text-sm font-semibold">
					<input
						class="h-4 w-4"
						name="isActive"
						type="checkbox"
						checked={formIsActive ?? data.link.isActive}
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

<ShareLinkModal
	open={isShareOpen}
	url={shortUrl}
	linkId={data.link.id}
	heading="Your link is ready!"
	subheading="Copy the link below to share it or choose a platform to share it to."
	onClose={closeShare}
/>
