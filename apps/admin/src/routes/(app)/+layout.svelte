<script lang="ts">
	import { page } from "$app/stores";
	import { env } from "$env/dynamic/public";
	import { fade, fly } from "svelte/transition";

	let { data, children } = $props();

	const navItems = [
		{ href: "/dashboard", label: "Dashboard" },
		{ href: "/links", label: "Links" },
		{ href: "/analytics", label: "Analytics" },
		{ href: "/settings", label: "Settings" },
	];
	let isMobileMenuOpen = $state(false);

	const isActive = (href: string) => $page.url.pathname.startsWith(href);
	const normalizeText = (value: string | null | undefined) => {
		const trimmed = value?.trim();
		return trimmed ? trimmed : null;
	};
	const toHostLabel = (value: string) => {
		const trimmed = value.trim();
		if (!trimmed) return null;
		try {
			return new URL(trimmed).host;
		} catch {
			return trimmed.replace(/^https?:\/\//, "").replace(/\/+$/, "");
		}
	};
	const shortDomainLabel = $derived.by(() => {
		const customLabel = normalizeText(env.PUBLIC_SHORTLINK_DISPLAY);
		if (customLabel) return customLabel;
		const baseUrl = normalizeText(env.PUBLIC_SHORTLINK_BASE_URL);
		if (!baseUrl) return "Short domain";
		return toHostLabel(baseUrl) ?? "Short domain";
	});
	const openMobileMenu = () => {
		isMobileMenuOpen = true;
	};
	const closeMobileMenu = () => {
		isMobileMenuOpen = false;
	};
	const handleWindowKeydown = (event: KeyboardEvent) => {
		if (!isMobileMenuOpen) return;
		if (event.key === "Escape") {
			closeMobileMenu();
		}
	};
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="min-h-screen bg-[var(--bg)]">
	<header class="border-b-2 border-black bg-white">
		<div class="mx-auto w-full max-w-6xl px-4 py-6">
			<div class="flex items-start justify-between gap-4 md:items-center">
				<div class="flex flex-col gap-2">
					<span class="text-xs tracking-[0.35em] text-[var(--muted)] uppercase"
						>{shortDomainLabel}</span
					>
					<h1 class="text-3xl font-semibold">Admin Console</h1>
				</div>
				<button
					class="grid h-11 w-11 shrink-0 place-items-center border-2 border-black bg-white shadow-[4px_4px_0px_#000] md:hidden"
					type="button"
					aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
					aria-expanded={isMobileMenuOpen}
					aria-controls="mobile-nav-menu"
					onclick={isMobileMenuOpen ? closeMobileMenu : openMobileMenu}
				>
					{#if isMobileMenuOpen}
						<svg
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M18 6L6 18" />
							<path d="M6 6l12 12" />
						</svg>
					{:else}
						<svg
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M4 7h16" />
							<path d="M4 12h16" />
							<path d="M4 17h16" />
						</svg>
					{/if}
				</button>
			</div>

			<div class="mt-4 hidden items-center justify-between gap-4 md:flex">
				<nav class="flex-1">
					<div class="flex flex-wrap items-center gap-3">
						{#each navItems as item (item.href)}
							<a
								class={`shrink-0 border-2 border-black px-4 py-2 text-sm font-semibold whitespace-nowrap shadow-[4px_4px_0px_#000] transition-transform duration-150 ${
									isActive(item.href) ? "bg-primary" : "bg-white hover:-translate-y-0.5"
								}`}
								href={item.href}
							>
								{item.label}
							</a>
						{/each}
					</div>
				</nav>

				<div class="flex min-w-0 flex-wrap items-center gap-3 text-sm">
					<span
						class="inline-block max-w-full truncate rounded-full border-2 border-black bg-black px-3 py-1 text-xs font-semibold text-white uppercase sm:max-w-[20rem]"
					>
						{data.user.email}
					</span>
					<form method="POST" action="/auth/logout" data-sveltekit-preload-data="off">
						<button class="brutal-button-secondary" type="submit">Sign out</button>
					</form>
				</div>
			</div>
		</div>
	</header>

	{#if isMobileMenuOpen}
		<div class="fixed inset-0 z-50 md:hidden">
			<button
				class="absolute inset-0 bg-black/40"
				type="button"
				aria-label="Close menu"
				onclick={closeMobileMenu}
				in:fade={{ duration: 120 }}
				out:fade={{ duration: 100 }}
			></button>
			<aside
				id="mobile-nav-menu"
				class="brutal-card relative z-10 flex h-full w-[min(20rem,88vw)] flex-col gap-6 border-r-2 border-black bg-[var(--paper)] p-5 shadow-[8px_0_0_#000]"
				in:fly={{ x: -28, duration: 190, opacity: 0.2 }}
				out:fly={{ x: -24, duration: 150, opacity: 0.15 }}
			>
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">Navigation</p>
						<p class="mt-2 text-xl font-semibold">Menu</p>
					</div>
					<button
						class="grid h-10 w-10 place-items-center border-2 border-black bg-white shadow-[3px_3px_0px_#000]"
						type="button"
						aria-label="Close menu"
						onclick={closeMobileMenu}
					>
						<svg
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M18 6L6 18" />
							<path d="M6 6l12 12" />
						</svg>
					</button>
				</div>

				<nav class="grid gap-3">
					{#each navItems as item (item.href)}
						<a
							class={`border-2 border-black px-4 py-2 text-sm font-semibold shadow-[4px_4px_0px_#000] ${
								isActive(item.href) ? "bg-primary" : "bg-white"
							}`}
							href={item.href}
							onclick={closeMobileMenu}
						>
							{item.label}
						</a>
					{/each}
				</nav>

				<div class="mt-auto grid gap-3 pt-4">
					<span
						class="inline-block max-w-full truncate rounded-full border-2 border-black bg-black px-3 py-1 text-xs font-semibold text-white uppercase"
					>
						{data.user.email}
					</span>
					<form method="POST" action="/auth/logout" data-sveltekit-preload-data="off">
						<button class="brutal-button-secondary w-full" type="submit">Sign out</button>
					</form>
				</div>
			</aside>
		</div>
	{/if}

	<main class="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
		{@render children()}
	</main>
</div>
