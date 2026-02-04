<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="min-h-screen bg-[var(--bg)] px-4 py-16">
	<div class="mx-auto flex w-full max-w-4xl flex-col gap-8">
		<header class="flex flex-col gap-3">
			<span class="brutal-pill w-fit">404</span>
			<h1 class="text-5xl font-semibold">That link vanished.</h1>
			<p class="max-w-xl text-sm text-[var(--muted)]">
				The slug <span class="font-semibold text-black">{$page.params.slug}</span> doesn't point to an active
				link right now.
			</p>
		</header>

		<div class="brutal-card p-6">
			<h2 class="text-xl font-semibold">What you can do</h2>
			<ul class="mt-4 grid gap-3 text-sm text-[var(--muted)]">
				<li>Double-check the URL for typos.</li>
				<li>Ask the owner for a fresh short link.</li>
				<li>Try again later if it was recently updated.</li>
			</ul>
		</div>
	</div>
</div>
