<script lang="ts">
	let { form } = $props();
</script>

<div class="min-h-screen bg-[var(--bg)] px-4 py-12">
	<div class="mx-auto flex w-full max-w-5xl flex-col gap-8">
		<header class="flex flex-col gap-3">
			<span class="brutal-pill w-fit">First run</span>
			<h1 class="text-4xl font-semibold">Create the admin profile.</h1>
			<p class="max-w-xl text-sm text-[var(--muted)]">
				Sign up with an email that lives in your allowlist. The account is locked to you.
			</p>
		</header>

		<div class="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
			<div class="brutal-card p-6">
				<h2 class="text-2xl font-semibold">Signup</h2>
				<p class="mt-2 text-sm text-[var(--muted)]">One-time setup for the admin dashboard.</p>

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
							autocomplete="new-password"
							required
						/>
					</label>

					<label class="flex flex-col gap-2 text-sm font-semibold">
						<span>Confirm password</span>
						<input
							class="brutal-input"
							name="confirmPassword"
							type="password"
							autocomplete="new-password"
							required
						/>
					</label>

					<button class="brutal-button w-fit" type="submit">Create admin</button>
				</form>
			</div>

			<div class="brutal-card-soft flex flex-col gap-5 p-6">
				<h3 class="text-lg font-semibold">Already set up?</h3>
				<p class="text-sm text-[var(--muted)]">If you already created the account, head back to login.</p>
				<a class="brutal-button-secondary w-fit" href="/auth/login">Back to login</a>
			</div>
		</div>
	</div>
</div>
