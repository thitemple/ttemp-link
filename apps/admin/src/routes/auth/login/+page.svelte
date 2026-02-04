<script lang="ts">
	let { form } = $props();
</script>

<div class="min-h-screen bg-[var(--bg)] px-4 py-12">
	<div class="mx-auto flex w-full max-w-5xl flex-col gap-8">
		<header class="flex flex-col gap-3">
			<span class="brutal-pill w-fit">Admin access</span>
			<h1 class="text-4xl font-semibold">Enter the control room.</h1>
			<p class="max-w-xl text-sm text-[var(--muted)]">
				Sign in to manage links, track performance, and shape what your short domain does.
			</p>
		</header>

		<div class="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
			<div class="brutal-card p-6">
				<h2 class="text-2xl font-semibold">Sign in</h2>
				<p class="mt-2 text-sm text-[var(--muted)]">
					Use your admin email and password to continue.
				</p>

				{#if form?.message}
					<div class="mt-5 border-2 border-black bg-[var(--accent)] px-4 py-3 text-sm font-semibold">
						{form.message}
					</div>
				{/if}

				<form method="POST" class="mt-6 flex flex-col gap-4" data-sveltekit-preload-data="off">
					<label class="flex flex-col gap-2 text-sm font-semibold">
						<span>Email</span>
						<input
							class="brutal-input"
							name="email"
							type="email"
							autocomplete="email"
							value={form?.values?.email ?? ''}
							required
						/>
					</label>

					<label class="flex flex-col gap-2 text-sm font-semibold">
						<span>Password</span>
						<input
							class="brutal-input"
							name="password"
							type="password"
							autocomplete="current-password"
							required
						/>
					</label>

					<button class="brutal-button w-fit" type="submit">Access dashboard</button>
				</form>
			</div>

			<div class="brutal-card-soft flex flex-col gap-5 p-6">
				<h3 class="text-lg font-semibold">Need to create the admin?</h3>
				<p class="text-sm text-[var(--muted)]">
					If your email is on the allowlist, you can create the admin account once. After that,
					signups are blocked.
				</p>
				<a class="brutal-button-secondary w-fit" href="/auth/signup">Go to signup</a>
			</div>
		</div>
	</div>
</div>
