<script lang="ts">
	let { data, form } = $props();

	const formIsActive = $derived.by(() =>
		typeof form?.values?.isActive !== 'undefined' ? form.values.isActive : undefined
	);
</script>

<section class="grid gap-6">
	<header class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h2 class="text-3xl font-semibold">Edit link</h2>
			<p class="text-sm text-[var(--muted)]">Update destination, slug, or status.</p>
		</div>
		<a class="brutal-button-secondary" href="/links">Back to links</a>
	</header>

	<div class="brutal-card p-6">
		<h3 class="text-xl font-semibold">Link details</h3>
		<p class="mt-2 text-sm text-[var(--muted)]">Make changes and save when you're ready.</p>

		{#if form?.message}
			<div class="mt-5 border-2 border-black bg-[var(--accent)] px-4 py-3 text-sm font-semibold">
				{form.message}
			</div>
		{/if}

		<form method="POST" action="?/update" class="mt-6 grid gap-4 md:grid-cols-2" data-sveltekit-preload-data="off">
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
			</div>
		</form>

		<form method="POST" action="?/delete" class="mt-6 border-t-2 border-black pt-6" data-sveltekit-preload-data="off">
			<p class="text-sm text-[var(--muted)]">This permanently removes the link and stats.</p>
			<button class="brutal-button-secondary mt-3" type="submit">Delete link</button>
		</form>
	</div>
</section>
