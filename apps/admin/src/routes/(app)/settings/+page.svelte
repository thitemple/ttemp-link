<script lang="ts">
	import type { ActionData, PageData } from "./$types";

	let { data, form } = $props<{ data: PageData; form?: ActionData }>();
	let trackCountryEnabled = $state(false);
	$effect(() => {
		trackCountryEnabled = data.settings.trackCountry;
	});

	const formatDate = (value: string | null) => {
		if (!value) return "Never";
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return "Unknown";
		return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
			date,
		);
	};

	const hasUpdate = $derived.by(() => {
		const latest = data.geo.latestVersionAt ? new Date(data.geo.latestVersionAt).getTime() : 0;
		const installed = data.geo.lastModifiedAt ? new Date(data.geo.lastModifiedAt).getTime() : 0;
		return latest > installed;
	});
</script>

<section class="grid gap-6">
	<div class="brutal-card p-6">
		<p class="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">Settings</p>
		<h2 class="mt-2 text-2xl font-semibold">Analytics configuration</h2>
		<p class="mt-2 text-sm text-[var(--muted)]">
			Configure country tracking and optional local GeoLite fallback.
		</p>
	</div>

	<div class="brutal-card p-6">
		<form
			method="POST"
			action="?/saveSettings"
			class="grid gap-4"
			data-sveltekit-preload-data="off"
		>
			<label class="flex items-start gap-3">
				<input type="checkbox" name="trackCountry" bind:checked={trackCountryEnabled} />
				<span>
					<span class="block text-sm font-semibold">Track countries</span>
					<span class="text-xs text-[var(--muted)]">
						Enable country-level analytics on click events.
					</span>
				</span>
			</label>

			<label class="flex items-start gap-3">
				<input
					type="checkbox"
					name="useGeoLiteFallback"
					checked={data.settings.useGeoLiteFallback}
					disabled={!trackCountryEnabled}
				/>
				<span>
					<span class="block text-sm font-semibold">Use GeoLite fallback</span>
					<span class="text-xs text-[var(--muted)]">
						Use local GeoLite country lookup when provider headers are missing.
					</span>
				</span>
			</label>

			<label class="grid gap-2">
				<span class="text-sm font-semibold">MaxMind license key</span>
				<input
					class="brutal-input"
					type="password"
					name="maxmindLicenseKey"
					placeholder={data.settings.hasStoredLicenseKey
						? "Stored key exists. Enter a new key to replace it."
						: "Paste your MaxMind license key"}
				/>
				<span class="text-xs text-[var(--muted)]">
					Used for GeoLite downloads. Empty value keeps the current stored key.
				</span>
			</label>

			<div>
				<button class="brutal-button" type="submit">Save settings</button>
			</div>
		</form>
	</div>

	<div class="brutal-card p-6">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div>
				<p class="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">GeoLite database</p>
				<h3 class="mt-2 text-xl font-semibold">Country database status</h3>
			</div>
			{#if hasUpdate}
				<span class="brutal-pill">Update available</span>
			{/if}
		</div>

		<div class="mt-6 grid gap-3 text-sm">
			<p>
				<span class="font-semibold">Source:</span>
				<a class="underline" href={data.geo.sourceUrl} target="_blank" rel="noreferrer"
					>{data.geo.sourceUrl}</a
				>
			</p>
			<p><span class="font-semibold">Installed:</span> {data.geo.hasDatabase ? "Yes" : "No"}</p>
			<p>
				<span class="font-semibold">Installed version date:</span>
				{formatDate(data.geo.lastModifiedAt)}
			</p>
			<p><span class="font-semibold">Fetched at:</span> {formatDate(data.geo.fetchedAt)}</p>
			<p>
				<span class="font-semibold">Latest available version:</span>
				{formatDate(data.geo.latestVersionAt)}
			</p>
			<p><span class="font-semibold">Last checked:</span> {formatDate(data.geo.checkedAt)}</p>
		</div>

		{#if !data.hasLicenseKey}
			<p class="mt-4 text-sm text-red-700">
				`MAXMIND_LICENSE_KEY` is not set. Header-based country detection still works.
			</p>
		{/if}

		<form method="POST" action="?/refreshGeoLite" class="mt-6" data-sveltekit-preload-data="off">
			<button class="brutal-button" type="submit" disabled={!data.hasLicenseKey}>
				Refresh database
			</button>
		</form>

		{#if form && "error" in form}
			<p class="mt-3 text-sm text-red-700">{form.error}</p>
		{/if}
	</div>
</section>
