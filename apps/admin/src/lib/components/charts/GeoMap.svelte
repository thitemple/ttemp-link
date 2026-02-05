<script lang="ts">
	import { onMount } from "svelte";
	import type { Chart } from "chart.js";

	let { data, className } = $props<{
		data: Array<{
			countryName: string | null;
			countryCode?: string | null;
			clicks: number;
		}>;
		className?: string;
	}>();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let chart = $state<Chart | null>(null);
	let features = $state<any[]>([]);

	const normalizeName = (value: string) =>
		value
			.toLowerCase()
			.replace(/&/g, "and")
			.replace(/[^a-z0-9]/g, "");

	const nameAliases: Record<string, string[]> = {
		unitedstates: ["unitedstatesofamerica"],
		russianfederation: ["russia"],
		czechia: ["czechrepublic"],
		southkorea: ["korea"],
		northkorea: ["koreademrep"],
		laos: ["laopdr"],
		iran: ["iranislamicrep"],
		syria: ["syrianarabrepublic"],
	};

	const buildValueMap = (entries: typeof data) => {
		const map = new Map<string, number>();
		for (const entry of entries) {
			if (!entry.countryName) continue;
			const normalized = normalizeName(entry.countryName);
			map.set(normalized, entry.clicks);
			const aliases = nameAliases[normalized];
			if (aliases) {
				for (const alias of aliases) {
					map.set(alias, entry.clicks);
				}
			}
		}
		return map;
	};

	const buildDataset = (worldFeatures: any[], entries: typeof data) => {
		const valueMap = buildValueMap(entries);
		return worldFeatures.map((feature) => {
			const name = String(feature?.properties?.name ?? "");
			const normalized = normalizeName(name);
			const value = valueMap.get(normalized) ?? 0;
			return { feature, value };
		});
	};

	const createChart = async () => {
		if (!canvas) return;
		const { default: ChartJS } = await import("chart.js/auto");
		await import("chartjs-chart-geo");
		const topojson = await import("topojson-client");
		const worldModule = await import("world-atlas/countries-110m.json");
		const world = "default" in worldModule ? worldModule.default : worldModule;
		const worldFeatures = (topojson.feature(world as any, world.objects.countries as any) as any)
			.features as any[];
		features = worldFeatures;
		const dataset = buildDataset(worldFeatures, data);
		chart = new ChartJS(canvas, {
			type: "choropleth",
			data: {
				labels: worldFeatures.map((feature: any) => feature.properties.name),
				datasets: [
					{
						label: "Engagements",
						data: dataset,
						outline: worldFeatures,
						borderColor: "#0b0b0b",
						borderWidth: 0.4,
						backgroundColor: "rgba(255, 93, 42, 0.5)",
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					xy: {
						projection: "equalEarth",
					},
				},
				plugins: {
					legend: {
						display: false,
					},
					tooltip: {
						callbacks: {
							label: (context) => {
								const raw = context.raw as {
									feature?: { properties?: { name?: string } };
									value?: number;
								};
								const name = raw?.feature?.properties?.name ?? "Unknown";
								const value = raw?.value ?? 0;
								return `${name}: ${value}`;
							},
						},
					},
				},
			},
		});
	};

	const updateChart = () => {
		if (!chart || features.length === 0) return;
		chart.data.datasets[0].data = buildDataset(features, data) as any;
		chart.update();
	};

	onMount(() => {
		void createChart();
		return () => {
			chart?.destroy();
			chart = null;
		};
	});

	$effect(() => {
		void updateChart();
	});
</script>

<div class={className}>
	<canvas bind:this={canvas}></canvas>
</div>
