<script lang="ts">
	import ChartCanvas from "$lib/components/charts/ChartCanvas.svelte";
	import GeoMap from "$lib/components/charts/GeoMap.svelte";
	import type { PageData } from "./$types";

	let { data } = $props<{ data: PageData }>();

	const ranges = [7, 30, 90];
	const numberFormatter = new Intl.NumberFormat();
	type DeviceEntry = { device: string | null; clicks: number };
	type BrowserEntry = { browser: string | null; clicks: number };
	type ReferrerEntry = { referrer: string | null; clicks: number };
	type CountryEntry = { countryName: string | null; countryCode: string | null; clicks: number };

	const formatDayLabel = (value: string) => {
		if (!value) return "";
		const date = new Date(`${value}T00:00:00Z`);
		try {
			return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
		} catch (error) {
			return value;
		}
	};

	const formatRangeDate = (value: string) => {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return "";
		try {
			return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
		} catch (error) {
			return date.toISOString().slice(0, 10);
		}
	};

	const buildSeries = (entries: Array<{ day: string; clicks: number }>) => {
		const start = new Date(data.rangeStart);
		const end = new Date(data.rangeEnd);
		const points: Array<{ day: string; clicks: number }> = [];
		for (
			let cursor = new Date(
				Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
			);
			cursor <= end;
			cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
		) {
			const day = cursor.toISOString().slice(0, 10);
			const match = entries.find((entry) => entry.day === day);
			points.push({ day, clicks: match?.clicks ?? 0 });
		}
		return points;
	};

	const series = $derived.by(() => buildSeries(data.clicksByDay));
	const lineLabels = $derived.by(() => series.map((entry) => formatDayLabel(entry.day)));
	const lineValues = $derived.by(() => series.map((entry) => entry.clicks));

	const deviceEntries = $derived.by(() => (data.devices ?? []) as DeviceEntry[]);
	const browserEntries = $derived.by(() => (data.browsers ?? []) as BrowserEntry[]);
	const referrerEntries = $derived.by(() => (data.referrers ?? []) as ReferrerEntry[]);
	const countryEntries = $derived.by(() => (data.countries ?? []) as CountryEntry[]);

	const labelize = (value: string | null | undefined) => {
		if (!value) return "Unknown";
		const normalized = value.replace(/_/g, " ");
		return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
	};

	const deviceLabels = $derived.by(() =>
		deviceEntries.map((entry: DeviceEntry) => labelize(entry.device)),
	);
	const deviceValues = $derived.by(() => deviceEntries.map((entry: DeviceEntry) => entry.clicks));
	const browserLabels = $derived.by(() =>
		browserEntries.map((entry: BrowserEntry) => labelize(entry.browser)),
	);
	const browserValues = $derived.by(() =>
		browserEntries.map((entry: BrowserEntry) => entry.clicks),
	);
	const referrerLabels = $derived.by(() =>
		referrerEntries.map((entry: ReferrerEntry) => labelize(entry.referrer)),
	);
	const referrerValues = $derived.by(() =>
		referrerEntries.map((entry: ReferrerEntry) => entry.clicks),
	);

	const topDayLabel = $derived.by(() => formatRangeDate(`${data.topDay?.day ?? ""}T00:00:00Z`));
	const topDayClicks = $derived.by(() => data.topDay?.clicks ?? 0);
	const topLocationLabel = $derived.by(() => {
		if (!data.topCountries?.length) return "No location data";
		return data.topCountries
			.map((entry: { countryName: string | null }) => entry.countryName)
			.filter(Boolean)
			.join(" & ");
	});

	const countryRows = $derived.by(() =>
		[...countryEntries].filter((entry) => entry.countryName).sort((a, b) => b.clicks - a.clicks),
	);
	const locationRows = $derived.by(() => countryRows);
	const rangeTotal = $derived.by(() => data.rangeTotalClicks ?? 0);
	const getRowKey = (row: CountryEntry, index: number) => row.countryName ?? index;
	const getRowLabel = (row: CountryEntry) => row.countryName ?? "Unknown";

	const handleFilterChange = (event: Event) => {
		const target = event.currentTarget as HTMLSelectElement | null;
		const form = target?.form;
		form?.requestSubmit();
	};
</script>

<section class="grid gap-6">
	<div class="brutal-card p-6">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div>
				<p class="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">Analytics overview</p>
				<h2 class="mt-2 text-2xl font-semibold">Engagement analytics</h2>
				<p class="mt-2 text-sm text-[var(--muted)]">
					Explore who is clicking your links and where they are coming from.
				</p>
			</div>
			<form
				method="GET"
				class="flex flex-wrap items-center gap-3"
				data-sveltekit-preload-data="off"
			>
				<label class="flex items-center gap-2 text-sm font-semibold">
					<span>Range</span>
					<select class="brutal-input" name="range" onchange={handleFilterChange}>
						{#each ranges as value (value)}
							<option {value} selected={data.range === value}>{value} days</option>
						{/each}
					</select>
				</label>
				<label class="flex items-center gap-2 text-sm font-semibold">
					<span>Link</span>
					<select class="brutal-input" name="link" onchange={handleFilterChange}>
						<option value="">All links</option>
						{#each data.links as link (link.id)}
							<option value={link.id} selected={data.linkId === link.id}>
								{link.slug}
							</option>
						{/each}
					</select>
				</label>
			</form>
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-2">
		<div class="brutal-card p-6">
			<p class="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">Top performing date</p>
			<h3 class="mt-3 text-2xl font-semibold">{topDayLabel || "No data yet"}</h3>
			<p class="mt-4 text-sm text-[var(--muted)]">
				{numberFormatter.format(topDayClicks)} engagements
			</p>
			<p class="mt-2 text-xs text-[var(--muted)]">
				{formatRangeDate(data.rangeStart)} — {formatRangeDate(data.rangeEnd)}
			</p>
		</div>

		<div class="brutal-card p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">
						Engagements by device
					</p>
					<h3 class="mt-2 text-xl font-semibold">Devices</h3>
				</div>
				<span class="brutal-pill">{numberFormatter.format(rangeTotal)} total</span>
			</div>
			<div class="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
				<ChartCanvas
					className="h-[220px]"
					type="doughnut"
					data={{
						labels: deviceLabels,
						datasets: [
							{
								data: deviceValues,
								backgroundColor: ["#8a5a00", "#f6d736", "#0b0b0b", "#f4f1ea", "#6b6b6b"],
								borderWidth: 2,
								borderColor: "#0b0b0b",
							},
						],
					}}
					options={{
						plugins: {
							legend: { display: false },
						},
						cutout: "70%",
					}}
				/>
				<div class="grid gap-2 text-sm">
					{#if deviceEntries.length === 0}
						<p class="text-[var(--muted)]">No device data yet.</p>
					{:else}
						{#each deviceEntries as entry (entry.device)}
							<div class="flex items-center justify-between gap-2 border-b border-black/10 pb-2">
								<span class="font-semibold">{labelize(entry.device)}</span>
								<span>{numberFormatter.format(entry.clicks)}</span>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	</div>

	<div class="brutal-card p-6">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div>
				<p class="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">Engagements over time</p>
				<h3 class="mt-2 text-xl font-semibold">Daily clicks</h3>
			</div>
			<span class="text-sm text-[var(--muted)]">UTC timeframe</span>
		</div>
		<div class="mt-6 h-[280px]">
			<ChartCanvas
				className="h-full"
				type="line"
				data={{
					labels: lineLabels,
					datasets: [
						{
							label: "Engagements",
							data: lineValues,
							borderColor: "#8a5a00",
							backgroundColor: "rgba(138, 90, 0, 0.2)",
							borderWidth: 2,
							tension: 0.35,
							fill: true,
						},
					],
				}}
				options={{
					plugins: {
						legend: { display: false },
					},
					scales: {
						x: {
							grid: { display: false },
						},
						y: {
							beginAtZero: true,
						},
					},
				}}
			/>
		</div>
	</div>

	<div class={`grid gap-6 ${data.showCountryAnalytics ? "lg:grid-cols-2" : ""}`}>
		{#if data.showCountryAnalytics}
			<div class="brutal-card p-6">
				<p class="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">
					Top performing location
				</p>
				<h3 class="mt-3 text-2xl font-semibold">{topLocationLabel}</h3>
				<p class="mt-4 text-sm text-[var(--muted)]">
					{numberFormatter.format(rangeTotal)} engagements
				</p>
				<p class="mt-2 text-xs text-[var(--muted)]">
					{formatRangeDate(data.rangeStart)} — {formatRangeDate(data.rangeEnd)}
				</p>
			</div>
		{/if}
		<div class="brutal-card p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">
						Engagements by referrer
					</p>
					<h3 class="mt-2 text-xl font-semibold">Referrer mix</h3>
				</div>
			</div>
			<div class="mt-6 h-[240px]">
				<ChartCanvas
					className="h-full"
					type="bar"
					data={{
						labels: referrerLabels,
						datasets: [
							{
								label: "Referrers",
								data: referrerValues,
								backgroundColor: "#f6d736",
								borderColor: "#0b0b0b",
								borderWidth: 2,
							},
						],
					}}
					options={{
						plugins: {
							legend: { display: false },
						},
						scales: {
							x: {
								ticks: { color: "#0b0b0b" },
								grid: { display: false },
							},
							y: { beginAtZero: true },
						},
					}}
				/>
			</div>
		</div>
	</div>

	{#if data.showCountryAnalytics}
		<div class="grid gap-6 lg:grid-cols-2">
			<div class="brutal-card p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">
							Engagements by location
						</p>
						<h3 class="mt-2 text-xl font-semibold">Global heatmap</h3>
					</div>
				</div>
				<div class="mt-6 h-[320px]">
					<GeoMap className="h-full" data={countryEntries} />
				</div>
			</div>

			<div class="brutal-card p-6">
				<div class="flex items-center justify-between gap-3">
					<div>
						<p class="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">
							Engagements by location
						</p>
						<h3 class="mt-2 text-xl font-semibold">Location breakdown</h3>
					</div>
				</div>

				<div class="mt-6 overflow-x-auto">
					<table class="brutal-table w-full min-w-[360px]">
						<thead>
							<tr>
								<th>#</th>
								<th>Country</th>
								<th>Engagements</th>
								<th>%</th>
							</tr>
						</thead>
						<tbody>
							{#if locationRows.length === 0}
								<tr>
									<td colspan="4" class="py-6 text-center text-sm text-[var(--muted)]">
										No location data yet.
									</td>
								</tr>
							{:else}
								{#each locationRows.slice(0, 10) as row, index (getRowKey(row, index))}
									<tr>
										<td class="font-semibold">{index + 1}</td>
										<td>{getRowLabel(row)}</td>
										<td class="text-right font-semibold">
											{numberFormatter.format(row.clicks)}
										</td>
										<td class="text-right">
											{rangeTotal === 0 ? "0%" : `${((row.clicks / rangeTotal) * 100).toFixed(1)}%`}
										</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{:else}
		<div class="brutal-card p-6">
			<p class="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">Engagements by location</p>
			<h3 class="mt-2 text-xl font-semibold">Country tracking is disabled</h3>
			<p class="mt-3 text-sm text-[var(--muted)]">
				Enable country tracking in settings to view map and location breakdown data.
			</p>
		</div>
	{/if}

	<div class="brutal-card p-6">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">Engagements by browser</p>
				<h3 class="mt-2 text-xl font-semibold">Browser share</h3>
			</div>
		</div>
		<div class="mt-6 h-[220px]">
			<ChartCanvas
				className="h-full"
				type="bar"
				data={{
					labels: browserLabels,
					datasets: [
						{
							label: "Browsers",
							data: browserValues,
							backgroundColor: "#8a5a00",
							borderColor: "#0b0b0b",
							borderWidth: 2,
						},
					],
				}}
				options={{
					plugins: { legend: { display: false } },
					scales: {
						x: { grid: { display: false } },
						y: { beginAtZero: true },
					},
				}}
			/>
		</div>
	</div>
</section>
