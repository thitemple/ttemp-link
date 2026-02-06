<script lang="ts">
	import { PUBLIC_SHORTLINK_BASE_URL } from "$env/static/public";
	import { createLink } from "$lib/model/link/mutations.remote";
	import ShareLinkModal from "$lib/components/ShareLinkModal.svelte";

	let { data } = $props();

	const ranges = [7, 15, 30];
	const base = $derived.by(() =>
		(data.shortBaseUrl ?? PUBLIC_SHORTLINK_BASE_URL ?? "").replace(/\/+$/, ""),
	);
	const shortUrl = (slug: string) => (base ? `${base}/${slug}` : `/${slug}`);
	const createdSlug = $derived.by(() => createLink.result?.createdSlug ?? "");
	const createdId = $derived.by(() => createLink.result?.createdId ?? "");
	const createdUrl = $derived.by(() => (createdSlug ? shortUrl(createdSlug) : ""));
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
	const destinationIssues = $derived.by(() => createLink.fields?.destination?.issues() ?? []);
	const destinationIssueKey = $derived.by(() =>
		destinationIssues.map((issue) => issue.message).join("|"),
	);
	let isModalOpen = $state(false);
	let lastCreatedId = $state("");
	let destinationEditedSinceIssue = $state(false);
	let lastDestinationIssueKey = $state("");
	const resetCreateLinkFields = () => {
		createLink.fields.destination.set("");
		createLink.fields.slug.set("");
		createLink.fields.title.set("");
	};
	const dashboardCreateLinkForm = createLink.enhance(async ({ submit }) => {
		const previousCreatedId = createLink.result?.createdId ?? "";
		await submit();
		const nextCreatedId = createLink.result?.createdId ?? "";
		if (!nextCreatedId || nextCreatedId === previousCreatedId || nextCreatedId === lastCreatedId) {
			return;
		}
		lastCreatedId = nextCreatedId;
		resetCreateLinkFields();
		isModalOpen = true;
	});
	const closeModal = () => {
		isModalOpen = false;
	};

	$effect(() => {
		if (destinationIssueKey === lastDestinationIssueKey) return;
		lastDestinationIssueKey = destinationIssueKey;
		destinationEditedSinceIssue = false;
	});

	const handleDestinationInput = (event: Event) => {
		if (!destinationIssues.length) return;
		const target = event.currentTarget as HTMLInputElement | null;
		if (!target) return;
		if (target.value.trim() !== "") {
			destinationEditedSinceIssue = true;
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
						class={`border-2 border-black px-3 py-1 text-xs font-semibold tracking-wide uppercase shadow-[3px_3px_0px_#000] ${
							data.range === value ? "bg-primary" : "bg-white"
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
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#if data.topLinks.length === 0}
						<tr>
							<td colspan="5" class="py-6 text-center text-sm text-[var(--muted)]">
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
										<a class="font-semibold hover:underline" href={`/links/${link.id}`}>
											{shortUrl(link.slug)}
										</a>
									</div>
								</td>
								<td>
									<span class="block max-w-[280px] truncate text-sm">{link.destinationUrl}</span>
								</td>
								<td class="text-right font-semibold">{link.clicks}</td>
								<td class="text-right">
									<a class="brutal-button-secondary" href={`/links/${link.id}`}>View</a>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>

	<div class="grid gap-6">
		<div class="brutal-card p-6">
			<p class="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">Quick create</p>
			<h3 class="mt-2 text-2xl font-semibold">Make a short link</h3>
			<p class="mt-2 text-sm text-[var(--muted)]">
				Paste a long URL and get a short link without leaving the dashboard.
			</p>

			{#if !hasFieldIssues}
				{#each createLink.fields.allIssues() as issue (issue.message)}
					<div class="mt-4 border-2 border-black bg-red-100 px-4 py-3 text-sm font-semibold">
						{issue.message}
					</div>
				{/each}
			{/if}

			<form {...dashboardCreateLinkForm} class="mt-5 grid gap-4" data-sveltekit-preload-data="off">
				<label class="flex flex-col gap-2 text-sm font-semibold">
					<span>Destination URL</span>
					{#if !destinationEditedSinceIssue}
						{#each destinationIssues as issue (issue.message)}
							<div
								class="rounded border-2 border-black bg-red-100 px-3 py-2 text-sm font-semibold text-red-900 shadow-[3px_3px_0px_#000]"
								role="alert"
							>
								{issue.message}
							</div>
						{/each}
					{/if}
					<input
						class="brutal-input"
						required
						placeholder="https://example.com"
						oninput={handleDestinationInput}
						{...createLink.fields.destination.as("url")}
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
						{...createLink.fields.slug.as("text")}
					/>
				</label>

				<button class="brutal-button w-full" type="submit">Create link</button>
			</form>
		</div>
		<div class="brutal-card p-6">
			<p class="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">Total clicks</p>
			<p class="mt-2 text-4xl font-semibold">{data.totalClicks}</p>
			<p class="mt-2 text-sm text-[var(--muted)]">All-time clicks across every short link.</p>
		</div>
		<div class="brutal-card p-6">
			<p class="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">Range snapshot</p>
			<p class="mt-2 text-3xl font-semibold">Last {data.range} days</p>
			<p class="mt-2 text-sm text-[var(--muted)]">
				Switch the range to see a different slice of your link performance.
			</p>
		</div>
	</div>
</section>

<ShareLinkModal
	open={isModalOpen}
	url={createdUrl}
	linkId={createdId}
	heading="Your link is ready!"
	subheading="Copy the link below to share it or choose a platform to share it to."
	onClose={closeModal}
/>
