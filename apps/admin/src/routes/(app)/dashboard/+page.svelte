<script lang="ts">
	import { createLink } from '$lib/model/link/mutations.remote';

	let { data } = $props();

	const ranges = [7, 15, 30];
	const base = $derived.by(() => (data.shortBaseUrl ?? '').replace(/\/+$/, ''));
	const shortUrl = (slug: string) => (base ? `${base}/${slug}` : `/${slug}`);
	const createdUrl = $derived.by(() => {
		const slug = createLink.result?.createdSlug;
		return slug ? shortUrl(slug) : '';
	});
	const statusMessage = $derived.by(() => createLink.result?.message ?? '');
	const fieldIssueCount = $derived.by(() => {
		const fields = createLink.fields;
		if (!fields) return 0;
		return (
			(fields.destination?.issues()?.length ?? 0) +
			(fields.slug?.issues()?.length ?? 0) +
			(fields.title?.issues()?.length ?? 0)
		);
	});
	const hasFieldIssues = $derived.by(() => fieldIssueCount > 0);
	let copiedUrl = $state('');
	const isCopied = $derived.by(() => copiedUrl !== '' && copiedUrl === createdUrl);
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;

	const copyLink = async () => {
		if (!createdUrl) return;
		try {
			await navigator.clipboard.writeText(createdUrl);
			copiedUrl = createdUrl;
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
</script>

<section class="grid gap-6 lg:grid-cols-[2fr_1fr]">
	<div class="brutal-card p-6">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div>
				<h2 class="text-2xl font-semibold">Top 10 links</h2>
				<p class="text-sm text-[var(--muted)]">Ranked by clicks for the selected range.</p>
			</div>
			<div class="flex flex-wrap gap-2">
				{#each ranges as value (value)}
					<a
						href={`?range=${value}`}
						class={`border-2 border-black px-3 py-1 text-xs font-semibold uppercase tracking-wide shadow-[3px_3px_0px_#000] ${
							data.range === value ? 'bg-[var(--accent)]' : 'bg-white'
						}`}
					>
						{value} days
					</a>
				{/each}
			</div>
		</div>

		<div class="mt-6 overflow-x-auto">
			<table class="brutal-table w-full min-w-[520px]">
				<thead>
					<tr>
						<th>Rank</th>
						<th>Short link</th>
						<th>Destination</th>
						<th>Clicks</th>
					</tr>
				</thead>
				<tbody>
					{#if data.topLinks.length === 0}
						<tr>
							<td colspan="4" class="py-6 text-center text-sm text-[var(--muted)]">
								No clicks yet. Create a link and share it.
							</td>
						</tr>
					{:else}
						{#each data.topLinks as link, index (link.id)}
							<tr>
								<td class="font-semibold">#{index + 1}</td>
								<td>
									<div class="flex flex-col">
										<span class="text-xs text-[var(--muted)]">{link.slug}</span>
										<span class="font-semibold">{shortUrl(link.slug)}</span>
									</div>
								</td>
								<td>
									<span class="block max-w-[280px] truncate text-sm">{link.destinationUrl}</span>
								</td>
								<td class="text-right font-semibold">{link.clicks}</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>

	<div class="grid gap-6">
		<div class="brutal-card p-6">
			<p class="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Quick create</p>
			<h3 class="mt-2 text-2xl font-semibold">Make a short link</h3>
			<p class="mt-2 text-sm text-[var(--muted)]">
				Paste a long URL and get a short link without leaving the dashboard.
			</p>

			{#if statusMessage && !hasFieldIssues}
				<div class="mt-4 border-2 border-black bg-[var(--accent)] px-4 py-3 text-sm font-semibold">
					{statusMessage}
				</div>
			{/if}
			{#if !hasFieldIssues}
				{#each createLink.fields.allIssues() as issue (issue.message)}
					<div class="mt-4 border-2 border-black bg-red-100 px-4 py-3 text-sm font-semibold">
						{issue.message}
					</div>
				{/each}
			{/if}

			{#if createdUrl}
				<div class="mt-4 grid gap-2">
					<p class="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
						New short link
					</p>
					<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
						<input class="brutal-input w-full" readonly value={createdUrl} />
						<button class="brutal-button-secondary w-full sm:w-auto" type="button" onclick={copyLink}>
							{isCopied ? 'Copied' : 'Copy'}
						</button>
					</div>
				</div>
			{/if}

			<form {...createLink} class="mt-5 grid gap-4" data-sveltekit-preload-data="off">
				<label class="flex flex-col gap-2 text-sm font-semibold">
					<span>Destination URL</span>
					{#each createLink.fields.destination.issues() as issue (issue.message)}
						<span class="text-xs text-red-600">{issue.message}</span>
					{/each}
					<input
						class="brutal-input"
						required
						placeholder="https://example.com"
						{...createLink.fields.destination.as('url')}
					/>
				</label>

				<label class="flex flex-col gap-2 text-sm font-semibold">
					<span>Custom slug (optional)</span>
					{#each createLink.fields.slug.issues() as issue (issue.message)}
						<span class="text-xs text-red-600">{issue.message}</span>
					{/each}
					<input
						class="brutal-input"
						placeholder="summer-sale"
						{...createLink.fields.slug.as('text')}
					/>
				</label>

				<button class="brutal-button w-full" type="submit">Create link</button>
			</form>
		</div>
		<div class="brutal-card p-6">
			<p class="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Total clicks</p>
			<p class="mt-2 text-4xl font-semibold">{data.totalClicks}</p>
			<p class="mt-2 text-sm text-[var(--muted)]">All-time clicks across every short link.</p>
		</div>
		<div class="brutal-card p-6">
			<p class="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Range snapshot</p>
			<p class="mt-2 text-3xl font-semibold">Last {data.range} days</p>
			<p class="mt-2 text-sm text-[var(--muted)]">
				Switch the range to see a different slice of your link performance.
			</p>
		</div>
	</div>
</section>
