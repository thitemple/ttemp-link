<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_SHORTLINK_BASE_URL } from "$env/static/public";
	import { getDashboardData } from "$lib/model/analytics/queries.remote";
	import { createLink } from "$lib/model/link/mutations.remote";
	import ShareLinkModal from "$lib/components/ShareLinkModal.svelte";

	const initialRange = Number(page.url.searchParams.get("range") ?? "7");
	let selectedRange = $state(initialRange);

	const ranges = [7, 15, 30];
	const base = (PUBLIC_SHORTLINK_BASE_URL ?? "").replace(/\/+$/, "");
	const shortUrl = (slug: string) => (base ? `${base}/${slug}` : `/${slug}`);

	const dashboard = $derived(await getDashboardData({ range: selectedRange }));

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

	const selectRange = (value: number) => {
		selectedRange = value;
		goto(`?range=${value}`, { replaceState: true });
	};
</script>

<svelte:boundary>
	<section class="grid gap-6 lg:grid-cols-[2fr_1fr]">
		<div class="brutal-card p-4 sm:p-6">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 class="text-xl font-semibold sm:text-2xl">Top 10 links</h2>
					<p class="text-sm text-[var(--muted)]">Ranked by clicks for the selected range.</p>
				</div>
				<div class="flex flex-wrap gap-2">
					{#each ranges as value (value)}
						<button
							type="button"
							onclick={() => selectRange(value)}
							class={`border-2 border-black px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase shadow-[3px_3px_0px_#000] sm:px-3 sm:text-xs ${
								dashboard.range === value ? "bg-primary" : "bg-white"
							}`}
						>
							{value} days
						</button>
					{/each}
				</div>
			</div>

			<div class="mt-6">
				{#if dashboard.topLinks.length === 0}
					<div
						class="rounded border-2 border-black bg-black/5 px-4 py-6 text-center text-sm text-[var(--muted)]"
					>
						No clicks yet. Create a link and share it.
					</div>
				{:else}
					<ol class="grid gap-3">
						{#each dashboard.topLinks as link, index (link.id)}
							<li
								class="rounded border-2 border-black bg-white p-3 shadow-[4px_4px_0px_#000] sm:p-4"
							>
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0 space-y-2">
										<div class="flex flex-wrap items-center gap-2">
											<span class="brutal-pill">#{index + 1}</span>
											<span class="text-xs text-[var(--muted)]">{link.slug}</span>
										</div>
										<a
											class="block truncate text-sm font-semibold hover:underline sm:text-base"
											href={`/links/${link.id}`}>{shortUrl(link.slug)}</a
										>
										<p class="text-sm break-all text-[var(--muted)]">
											{link.destinationUrl}
										</p>
									</div>
									<div class="flex shrink-0 flex-col items-end gap-2 sm:gap-3">
										<div class="text-right">
											<p class="text-[10px] tracking-[0.16em] text-[var(--muted)] uppercase">
												Clicks
											</p>
											<p class="text-lg leading-none font-semibold sm:text-2xl">{link.clicks}</p>
										</div>
										<a
											class="brutal-button-secondary inline-flex px-3 py-1.5 text-xs whitespace-nowrap sm:px-4 sm:py-2 sm:text-sm"
											href={`/links/${link.id}`}>View</a
										>
									</div>
								</div>
							</li>
						{/each}
					</ol>
				{/if}
			</div>
		</div>

		<div class="grid gap-6">
			<div class="brutal-card p-4 sm:p-6">
				<p class="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">Quick create</p>
				<h3 class="mt-2 text-xl font-semibold sm:text-2xl">Make a short link</h3>
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

				<form
					{...dashboardCreateLinkForm}
					class="mt-5 grid gap-4"
					data-sveltekit-preload-data="off"
				>
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
			<div class="brutal-card p-4 sm:p-6">
				<p class="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">Total clicks</p>
				<p class="mt-2 text-3xl font-semibold sm:text-4xl">{dashboard.totalClicks}</p>
				<p class="mt-2 text-sm text-[var(--muted)]">All-time clicks across every short link.</p>
			</div>
		</div>
	</section>

	{#snippet pending()}
		<div class="flex items-center justify-center py-12">
			<p class="text-sm text-[var(--muted)]">Loading dashboard...</p>
		</div>
	{/snippet}

	{#snippet failed(error, reset)}
		<div class="brutal-card p-6 text-center">
			<p class="text-sm text-red-700">Failed to load dashboard data. Please try again.</p>
			<button class="brutal-button-secondary mt-4" onclick={reset}>Retry</button>
		</div>
	{/snippet}
</svelte:boundary>

<ShareLinkModal
	open={isModalOpen}
	url={createdUrl}
	linkId={createdId}
	heading="Your link is ready!"
	subheading="Copy the link below to share it or choose a platform to share it to."
	onClose={closeModal}
/>
