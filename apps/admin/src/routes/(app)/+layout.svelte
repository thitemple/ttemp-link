<script lang="ts">
	import { page } from '$app/stores';

	let { data, children } = $props();

	const navItems = [
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/links', label: 'Links' }
	];

	const isActive = (href: string) => $page.url.pathname.startsWith(href);
</script>

<div class="min-h-screen bg-[var(--bg)]">
	<header class="border-b-2 border-black bg-white">
		<div class="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
			<div class="flex flex-col gap-2">
				<span class="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">ttemp.link</span>
				<h1 class="text-3xl font-semibold">Admin Console</h1>
			</div>

			<nav class="flex flex-wrap gap-3">
				{#each navItems as item (item.href)}
					<a
						class={`border-2 border-black px-4 py-2 text-sm font-semibold shadow-[4px_4px_0px_#000] transition-transform duration-150 ${
							isActive(item.href)
								? 'bg-[var(--accent)]'
								: 'bg-white hover:-translate-y-0.5'
						}`}
						href={item.href}
					>
						{item.label}
					</a>
				{/each}
			</nav>

			<div class="flex flex-wrap items-center gap-3 text-sm">
				<span class="rounded-full border-2 border-black bg-black px-3 py-1 text-xs font-semibold uppercase text-white">
					{data.user.email}
				</span>
				<form method="POST" action="/auth/logout" data-sveltekit-preload-data="off">
					<button class="brutal-button-secondary" type="submit">Sign out</button>
				</form>
			</div>
		</div>
	</header>

	<main class="mx-auto w-full max-w-6xl px-4 py-10">
		{@render children()}
	</main>
</div>
