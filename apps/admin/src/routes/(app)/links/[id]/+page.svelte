<script lang="ts">
	import ShareLinkModal from '$lib/components/ShareLinkModal.svelte';

	let { data, form } = $props();

	const base = $derived.by(() => (data.shortBaseUrl ?? '').replace(/\/+$/, ''));
	const shortUrl = $derived.by(() => (base ? `${base}/${data.link.slug}` : `/${data.link.slug}`));
	const hostname = $derived.by(() => {
		try {
			return new URL(data.link.destinationUrl).hostname;
		} catch (error) {
			return 'Destination';
		}
	});
	const titleText = $derived.by(() => data.link.title ?? 'untitled');
	const displayTitle = $derived.by(() => `${hostname} — ${titleText}`);
	const formatDateTime = (value: string | number | Date | null | undefined) => {
		if (!value) return '';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '';
		try {
			return new Intl.DateTimeFormat(undefined, {
				dateStyle: 'long',
				timeStyle: 'short',
				timeZoneName: 'short'
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

	const lastRangeClicks = $derived.by(() => data.stats?.lastRangeClicks ?? 0);
	const previousRangeClicks = $derived.by(() => data.stats?.previousRangeClicks ?? 0);
	const weeklyChange = $derived.by(() => {
		if (previousRangeClicks === 0) return 0;
		return Math.round(((lastRangeClicks - previousRangeClicks) / previousRangeClicks) * 100);
	});
	const weeklyChangeLabel = $derived.by(() =>
		`${weeklyChange > 0 ? '+' : ''}${weeklyChange}%`
	);

	let copiedUrl = $state('');
	const isCopied = $derived.by(() => copiedUrl !== '' && copiedUrl === shortUrl);
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;
	let isShareOpen = $state(false);
	let isEditOpen = $state(false);

	const copyShortUrl = async () => {
		if (!shortUrl) return;
		try {
			await navigator.clipboard.writeText(shortUrl);
			copiedUrl = shortUrl;
			if (copyTimeout) {
				clearTimeout(copyTimeout);
			}
			copyTimeout = setTimeout(() => {
				copiedUrl = '';
				copyTimeout = null;
			}, 2000);
		} catch (error) {
			copiedUrl = '';
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

	const formIsActive = $derived.by(() =>
		typeof form?.values?.isActive !== 'undefined' ? form.values.isActive : undefined
	);
</script>

<section class="grid gap-6">
	<div class="brutal-card p-6">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div class="flex flex-wrap items-start gap-4">
				<div class="grid h-12 w-12 place-items-center rounded-2xl border-2 border-black bg-white text-lg font-semibold">
					{hostname.slice(0, 2).toUpperCase()}
				</div>
				<div>
					<p class="text-3xl font-semibold">{displayTitle}</p>
					<div class="mt-2 flex flex-wrap items-center gap-3 text-sm">
						<a
							class="font-semibold text-[var(--accent-2)] hover:underline"
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
							{isCopied ? '✓' : '⧉'}
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
					<div class="absolute right-0 top-12 z-20 min-w-[160px] rounded-xl border-2 border-black bg-white p-3 shadow-[4px_4px_0px_#000]">
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
				<button class="brutal-button-secondary flex items-center gap-2" type="button" onclick={openShare}>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M18 8a3 3 0 1 0-2.8-4H15a3 3 0 0 0 .2 1.1L8.7 9.1a3 3 0 1 0 0 5.8l6.5 4a3 3 0 1 0 1-1.6l-6.6-4.1a3 3 0 0 0 0-2.4l6.6-4.1A3 3 0 0 0 18 8z"
						/>
					</svg>
					Share
				</button>
			</div>
		</div>

		<div class="mt-6 flex flex-wrap items-center justify-between gap-4 border-t-2 border-black/10 pt-4 text-sm text-[var(--muted)]">
			<div class="inline-flex items-center gap-2">
				<span class="text-base">🏷</span>
				<span>No tags</span>
			</div>
			<span>{createdAtLabel}</span>
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
				<div class="mt-5 border-2 border-black bg-[var(--accent)] px-4 py-3 text-sm font-semibold">
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
						value={form?.values?.destination ?? data.link.destinationUrl}
					/>
				</label>

				<label class="flex flex-col gap-2 text-sm font-semibold">
					<span>Title (optional)</span>
					<input
						class="brutal-input"
						name="title"
						value={form?.values?.title ?? data.link.title ?? ''}
					/>
				</label>

				<label class="flex flex-col gap-2 text-sm font-semibold">
					<span>Slug</span>
					<input class="brutal-input" name="slug" value={form?.values?.slug ?? data.link.slug} />
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

				<div class="md:col-span-2 flex flex-wrap gap-3">
					<button class="brutal-button" type="submit">Save changes</button>
					<a class="brutal-button-secondary" href="/links">Back to links</a>
				</div>
			</form>
		</div>
	{/if}
</section>

<ShareLinkModal open={isShareOpen} url={shortUrl} onClose={closeShare} />
