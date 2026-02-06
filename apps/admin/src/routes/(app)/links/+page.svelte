<script lang="ts">
	import { PUBLIC_SHORTLINK_BASE_URL } from "$env/static/public";
	import { getLinkList } from "$lib/model/link/queries.remote";

	const base = (PUBLIC_SHORTLINK_BASE_URL ?? "").replace(/\/+$/, "");
	const shortUrl = (slug: string) => (base ? `${base}/${slug}` : `/${slug}`);

	const { links } = await getLinkList();
</script>

<svelte:boundary>
	<section class="grid gap-6">
		<header class="flex flex-wrap items-end justify-between gap-4">
			<div>
				<h2 class="text-3xl font-semibold">Your links</h2>
				<p class="text-sm text-[var(--muted)]">Review all of the short URLs you control.</p>
			</div>
			<a class="brutal-button" href="/links/new">Create new link</a>
		</header>

		<div class="brutal-card p-6">
			<h3 class="text-xl font-semibold">Links</h3>
			<p class="mt-2 text-sm text-[var(--muted)]">All short links in your account.</p>

			<div class="mt-6 overflow-x-auto">
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
						{#if links.length === 0}
							<tr>
								<td colspan="6" class="py-6 text-center text-sm text-[var(--muted)]">
									No links yet. Use Create new link to get started.
								</td>
							</tr>
						{:else}
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
											class={`inline-flex items-center rounded-full border-2 border-black px-3 py-1 text-xs font-semibold ${
												link.isActive ? "bg-emerald-700 text-white" : "bg-black/10"
											}`}
										>
											{link.isActive ? "Active" : "Inactive"}
										</span>
									</td>
									<td class="text-right font-semibold">{link.totalClicks}</td>
									<td>{new Date(link.createdAt).toLocaleDateString()}</td>
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
	</section>

	{#snippet pending()}
		<div class="flex items-center justify-center py-12">
			<p class="text-sm text-[var(--muted)]">Loading links...</p>
		</div>
	{/snippet}

	{#snippet failed(error, reset)}
		<div class="brutal-card p-6 text-center">
			<p class="text-sm text-red-700">Failed to load links. Please try again.</p>
			<button class="brutal-button-secondary mt-4" onclick={reset}>Retry</button>
		</div>
	{/snippet}
</svelte:boundary>
