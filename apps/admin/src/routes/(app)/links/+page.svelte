<script lang="ts">
	import { PUBLIC_SHORTLINK_BASE_URL } from "$env/static/public";
	import { getLinkList } from "$lib/model/link/queries.remote";

	const base = (PUBLIC_SHORTLINK_BASE_URL ?? "").replace(/\/+$/, "");
	const shortUrl = (slug: string) => (base ? `${base}/${slug}` : `/${slug}`);
	const numberFormatter = new Intl.NumberFormat();
	const formatDate = (value: string | Date) => {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return "";
		return date.toLocaleDateString();
	};
	const statusClass = (isActive: boolean) =>
		isActive ? "bg-emerald-700 text-white" : "bg-black/10";

	const { links } = await getLinkList();
</script>

<svelte:boundary>
	<section class="grid gap-6">
		<header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<h2 class="text-2xl font-semibold sm:text-3xl">Your links</h2>
				<p class="text-sm text-[var(--muted)]">Review all of the short URLs you control.</p>
			</div>
			<a class="brutal-button inline-flex w-full justify-center sm:w-auto" href="/links/new"
				>Create new link</a
			>
		</header>

		<div class="brutal-card p-4 sm:p-6">
			<h3 class="text-lg font-semibold sm:text-xl">Links</h3>
			<p class="mt-2 text-sm text-[var(--muted)]">All short links in your account.</p>

			{#if links.length === 0}
				<div
					class="mt-6 rounded border-2 border-black bg-black/5 px-4 py-6 text-center text-sm text-[var(--muted)]"
				>
					No links yet. Use Create new link to get started.
				</div>
			{:else}
				<div class="mt-6 grid gap-3 md:hidden">
					{#each links as link (link.id)}
						<article class="rounded border-2 border-black bg-white p-3 shadow-[4px_4px_0px_#000]">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0 space-y-2">
									<p class="text-xs text-[var(--muted)]">{link.slug}</p>
									<a
										class="block text-sm font-semibold break-all hover:underline"
										href={`/links/${link.id}`}>{shortUrl(link.slug)}</a
									>
									<p class="text-xs break-all text-[var(--muted)]">{link.destinationUrl}</p>
								</div>
								<span
									class={`inline-flex shrink-0 items-center rounded-full border-2 border-black px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase ${statusClass(link.isActive)}`}
								>
									{link.isActive ? "Active" : "Inactive"}
								</span>
							</div>
							<div class="mt-3 flex items-end justify-between gap-3">
								<p class="text-xs text-[var(--muted)]">{formatDate(link.createdAt)}</p>
								<div class="flex items-center gap-2">
									<div class="text-right">
										<p class="text-[10px] tracking-[0.16em] text-[var(--muted)] uppercase">
											Clicks
										</p>
										<p class="text-sm font-semibold">{numberFormatter.format(link.totalClicks)}</p>
									</div>
									<a
										class="brutal-button-secondary inline-flex px-3 py-1.5 text-xs"
										href={`/links/${link.id}`}>View</a
									>
								</div>
							</div>
						</article>
					{/each}
				</div>

				<div class="mt-6 hidden overflow-x-auto md:block">
					<table class="brutal-table w-full min-w-[720px]">
						<thead>
							<tr>
								<th>Short link</th>
								<th>Destination</th>
								<th>Status</th>
								<th>Total clicks</th>
								<th>Created</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{#each links as link (link.id)}
								<tr>
									<td>
										<div class="flex flex-col">
											<span class="text-xs text-[var(--muted)]">{link.slug}</span>
											<span class="font-semibold">{shortUrl(link.slug)}</span>
										</div>
									</td>
									<td class="max-w-[260px]">
										<span class="block truncate">{link.destinationUrl}</span>
									</td>
									<td>
										<span
											class={`inline-flex items-center rounded-full border-2 border-black px-3 py-1 text-xs font-semibold ${statusClass(link.isActive)}`}
										>
											{link.isActive ? "Active" : "Inactive"}
										</span>
									</td>
									<td class="text-right font-semibold">
										{numberFormatter.format(link.totalClicks)}
									</td>
									<td>{formatDate(link.createdAt)}</td>
									<td class="text-right">
										<a class="brutal-button-secondary" href={`/links/${link.id}`}>View</a>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</section>

	{#snippet pending()}
		<div class="flex items-center justify-center py-12">
			<p class="text-sm text-[var(--muted)]">Loading links...</p>
		</div>
	{/snippet}

	{#snippet failed(error, reset)}
		<div class="brutal-card p-4 text-center sm:p-6">
			<p class="text-sm text-red-700">Failed to load links. Please try again.</p>
			<button class="brutal-button-secondary mt-4" onclick={reset}>Retry</button>
		</div>
	{/snippet}
</svelte:boundary>
