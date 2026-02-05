<div class="min-h-screen bg-[var(--bg)] px-4 py-16">
	<div class="mx-auto flex w-full max-w-4xl flex-col gap-8">
		<header class="flex flex-col gap-3">
			<span class="brutal-pill w-fit">Short domain</span>
			<h1 class="text-4xl font-semibold">This domain only serves redirects.</h1>
			<p class="max-w-xl text-sm text-[var(--muted)]">
				If you're looking for the admin dashboard, open the app domain instead.
			</p>
		</header>

		<div class="brutal-card p-6">
			<h2 class="text-xl font-semibold">Need the dashboard?</h2>
			<p class="mt-2 text-sm text-[var(--muted)]">
				Set <code class="rounded border border-black bg-white px-2 py-0.5">PUBLIC_ADMIN_APP_URL</code> to redirect
				here to your admin domain.
			</p>
		</div>
	</div>
</div>
