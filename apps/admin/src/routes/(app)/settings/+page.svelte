<script lang="ts">
	import { getSettingsPageData } from "$lib/model/settings/queries.remote";
	import { saveSettings, refreshGeoLite } from "$lib/model/settings/mutations.remote";

	const settingsData = $derived(await getSettingsPageData());

	let trackCountryEnabled = $state(false);
	let didInitTrackCountry = $state(false);
	let refreshError = $state("");
	let isRefreshing = $state(false);

	$effect(() => {
		if (didInitTrackCountry) return;
		trackCountryEnabled = settingsData.settings.trackCountry;
		didInitTrackCountry = true;
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
		const latest = settingsData.geo.latestVersionAt
			? new Date(settingsData.geo.latestVersionAt).getTime()
			: 0;
		const installed = settingsData.geo.lastModifiedAt
			? new Date(settingsData.geo.lastModifiedAt).getTime()
			: 0;
		return latest > installed;
	});

	const handleRefreshGeoLite = async () => {
		if (isRefreshing) return;
		isRefreshing = true;
		refreshError = "";
		try {
			await refreshGeoLite();
		} catch (err) {
			refreshError =
				err instanceof Error ? err.message : "Unable to refresh the GeoLite database.";
		} finally {
			isRefreshing = false;
		}
	};
</script>

<svelte:boundary>
	<section class="grid gap-6">
		<div class="brutal-card p-6">
			<p class="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">Settings</p>
			<h2 class="mt-2 text-2xl font-semibold">Analytics configuration</h2>
			<p class="mt-2 text-sm text-[var(--muted)]">
				Configure country tracking and optional local GeoLite fallback.
			</p>
		</div>

		<div class="brutal-card p-6">
			<form {...saveSettings} class="grid gap-4" data-sveltekit-preload-data="off">
				<label class="flex items-start gap-3">
					<input
						{...saveSettings.fields.trackCountry.as("checkbox")}
						checked={trackCountryEnabled}
						onchange={(e) => {
							trackCountryEnabled = e.currentTarget.checked;
						}}
					/>
					<span>
						<span class="block text-sm font-semibold">Track countries</span>
						<span class="text-xs text-[var(--muted)]">
							Enable country-level analytics on click events.
						</span>
					</span>
				</label>

				<label class="flex items-start gap-3">
					<input
						{...saveSettings.fields.useGeoLiteFallback.as("checkbox")}
						checked={settingsData.settings.useGeoLiteFallback}
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
						{...saveSettings.fields.maxmindLicenseKey.as("password")}
						placeholder={settingsData.settings.hasStoredLicenseKey
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
					<a
						class="underline"
						href={settingsData.geo.sourceUrl}
						target="_blank"
						rel="noreferrer">{settingsData.geo.sourceUrl}</a
					>
				</p>
				<p>
					<span class="font-semibold">Installed:</span>
					{settingsData.geo.hasDatabase ? "Yes" : "No"}
				</p>
				<p>
					<span class="font-semibold">Installed version date:</span>
					{formatDate(settingsData.geo.lastModifiedAt)}
				</p>
				<p>
					<span class="font-semibold">Fetched at:</span>
					{formatDate(settingsData.geo.fetchedAt)}
				</p>
				<p>
					<span class="font-semibold">Latest available version:</span>
					{formatDate(settingsData.geo.latestVersionAt)}
				</p>
				<p>
					<span class="font-semibold">Last checked:</span>
					{formatDate(settingsData.geo.checkedAt)}
				</p>
			</div>

			{#if !settingsData.hasLicenseKey}
				<p class="mt-4 text-sm text-red-700">
					`MAXMIND_LICENSE_KEY` is not set. Header-based country detection still works.
				</p>
			{/if}

			<div class="mt-6">
				<button
					class="brutal-button"
					type="button"
					disabled={!settingsData.hasLicenseKey || isRefreshing}
					onclick={handleRefreshGeoLite}
				>
					{isRefreshing ? "Refreshing..." : "Refresh database"}
				</button>
			</div>

			{#if refreshError}
				<p class="mt-3 text-sm text-red-700">{refreshError}</p>
			{/if}
		</div>
	</section>

	{#snippet pending()}
		<div class="flex items-center justify-center py-12">
			<p class="text-sm text-[var(--muted)]">Loading settings...</p>
		</div>
	{/snippet}

	{#snippet failed(error, reset)}
		<div class="brutal-card p-6 text-center">
			<p class="text-sm text-red-700">Failed to load settings. Please try again.</p>
			<button class="brutal-button-secondary mt-4" onclick={reset}>Retry</button>
		</div>
	{/snippet}
</svelte:boundary>
