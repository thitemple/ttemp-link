<script lang="ts">
	let { data, form } = $props();

	const base = $derived.by(() => (data.shortBaseUrl ?? '').replace(/\/+$/, ''));
	const shortUrl = (slug: string) => (base ? `${base}/${slug}` : `/${slug}`);
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

		{#if form?.message}
			<div class="mt-5 border-2 border-black bg-[var(--accent)] px-4 py-3 text-sm font-semibold">
				{form.message}
			</div>
		{/if}

		<form
			method="POST"
			action="?/create"
			class="mt-6 grid gap-4 md:grid-cols-2"
			data-sveltekit-preload-data="off"
		>
			<label class="flex flex-col gap-2 text-sm font-semibold md:col-span-2">
				<span>Destination URL</span>
				<input
					class="brutal-input"
					name="destination"
					required
					placeholder="https://example.com"
					value={form?.values?.destination ?? ''}
				/>
			</label>

			<label class="flex flex-col gap-2 text-sm font-semibold">
				<span>Title (optional)</span>
				<input class="brutal-input" name="title" value={form?.values?.title ?? ''} />
			</label>

			<label class="flex flex-col gap-2 text-sm font-semibold">
				<span>Custom slug (optional)</span>
				<input class="brutal-input" name="slug" value={form?.values?.slug ?? ''} />
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
											link.isActive ? 'bg-[var(--accent-2)] text-white' : 'bg-black/10'
										}`}
									>
										{link.isActive ? 'Active' : 'Inactive'}
									</span>
								</td>
								<td class="text-right font-semibold">{link.totalClicks}</td>
								<td>{new Date(link.createdAt).toLocaleDateString()}</td>
								<td class="text-right">
									<div class="flex items-center justify-end gap-2">
										<a class="brutal-button-secondary" href={`/links/${link.id}`}>Edit</a>
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
