<script lang="ts">
	import { goto } from "$app/navigation";
	import { createLink } from "$lib/model/link/mutations.remote";

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
	const resetCreateLinkFields = () => {
		createLink.fields.destination.set("");
		createLink.fields.slug.set("");
		createLink.fields.title.set("");
	};

	const createLinkForm = createLink.enhance(async ({ submit }) => {
		const previousCreatedId = createLink.result?.createdId ?? "";
		await submit();
		const createdId = createLink.result?.createdId ?? "";
		if (!createdId || createdId === previousCreatedId) return;
		resetCreateLinkFields();
		await goto(`/links/${encodeURIComponent(createdId)}?created=1`);
	});
</script>

<section class="grid gap-6">
	<header class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h2 class="text-3xl font-semibold">Create new link</h2>
			<p class="text-sm text-[var(--muted)]">
				Create a short URL and manage it later from your links list.
			</p>
		</div>
		<a class="brutal-button-secondary" href="/links">Back to links</a>
	</header>

	<div class="brutal-card p-6">
		<p class="text-sm text-[var(--muted)]">Leave slug empty to auto-generate a 7-character slug.</p>

		{#if !hasFieldIssues}
			{#each createLink.fields.allIssues() as issue (issue.message)}
				<div class="mt-5 border-2 border-black bg-red-100 px-4 py-3 text-sm font-semibold">
					{issue.message}
				</div>
			{/each}
		{/if}

		<form
			{...createLinkForm}
			class="mt-6 grid gap-4 md:grid-cols-2"
			data-sveltekit-preload-data="off"
		>
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
</section>
