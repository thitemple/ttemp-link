<script lang="ts">
	import { PUBLIC_SHORTLINK_BASE_URL } from "$env/static/public";
	import { createLink } from "$lib/model/link/mutations.remote";

	let { data } = $props();

	const base = $derived.by(() =>
		(data.shortBaseUrl ?? PUBLIC_SHORTLINK_BASE_URL ?? "").replace(/\/+$/, ""),
	);
	const shortUrl = (slug: string) => (base ? `${base}/${slug}` : `/${slug}`);
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
</script>

<section class="grid gap-6">
	<header class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h2 class="text-3xl font-semibold">Your links</h2>
			<p class="text-sm text-[var(--muted)]">Create, edit, and track the short URLs you control.</p>
		</div>
		<a class="brutal-button-secondary" href="/dashboard">View dashboard</a>
	</header>

	<div class="brutal-card p-6">
		<h3 class="text-xl font-semibold">Create a short link</h3>
		<p class="mt-2 text-sm text-[var(--muted)]">
			Leave slug empty to auto-generate a 7-character slug.
		</p>

		{#if !hasFieldIssues}
			{#each createLink.fields.allIssues() as issue (issue.message)}
				<div class="mt-5 border-2 border-black bg-red-100 px-4 py-3 text-sm font-semibold">
					{issue.message}
				</div>
			{/each}
		{/if}

		<form {...createLink} class="mt-6 grid gap-4 md:grid-cols-2" data-sveltekit-preload-data="off">
			<label class="flex flex-col gap-2 text-sm font-semibold md:col-span-2">
				<span>Destination URL</span>
				{#each createLink.fields.destination.issues() as issue (issue.message)}
					<span class="text-xs text-red-600">{issue.message}</span>
				{/each}
				<input
					class="brutal-input"
					required
					placeholder="https://example.com"
					{...createLink.fields.destination.as("url")}
				/>
			</label>

			<label class="flex flex-col gap-2 text-sm font-semibold">
				<span>Title (optional)</span>
				{#each createLink.fields.title.issues() as issue (issue.message)}
					<span class="text-xs text-red-600">{issue.message}</span>
				{/each}
				<input class="brutal-input" {...createLink.fields.title.as("text")} />
			</label>

			<label class="flex flex-col gap-2 text-sm font-semibold">
				<span>Custom slug (optional)</span>
				{#each createLink.fields.slug.issues() as issue (issue.message)}
					<span class="text-xs text-red-600">{issue.message}</span>
				{/each}
				<input class="brutal-input" {...createLink.fields.slug.as("text")} />
			</label>

			<div class="md:col-span-2">
				<button class="brutal-button" type="submit">Create link</button>
			</div>
		</form>
	</div>

	<div class="brutal-card p-6">
		<h3 class="text-xl font-semibold">All links</h3>
		<p class="mt-2 text-sm text-[var(--muted)]">Edit, deactivate, or delete links.</p>

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
					{#if data.links.length === 0}
						<tr>
							<td colspan="6" class="py-6 text-center text-sm text-[var(--muted)]">
								No links yet. Create your first one above.
							</td>
						</tr>
					{:else}
						{#each data.links as link (link.id)}
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
									<div class="flex items-center justify-end gap-2">
										<a class="brutal-button-secondary" href={`/links/${link.id}`}>View</a>
										<form method="POST" action="?/delete" data-sveltekit-preload-data="off">
											<input type="hidden" name="id" value={link.id} />
											<button class="brutal-button" type="submit">Delete</button>
										</form>
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</section>
