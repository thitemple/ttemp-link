<script lang="ts">
	import { onMount } from "svelte";
	import type { Chart, ChartConfiguration, ChartData, ChartOptions } from "chart.js";

	let { type, data, options, className } = $props<{
		type: ChartConfiguration["type"];
		data: ChartData;
		options?: ChartOptions | Record<string, unknown>;
		className?: string;
	}>();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let chart = $state<Chart | null>(null);
	let currentType = $state<ChartConfiguration["type"] | null>(null);

	const createChart = async () => {
		if (!canvas) return;
		const { default: ChartJS } = await import("chart.js/auto");
		chart = new ChartJS(canvas, {
			type,
			data,
			options: (options ?? {}) as ChartOptions,
		});
		currentType = type;
	};

	const updateChart = async () => {
		if (!canvas) return;
		if (!chart || currentType !== type) {
			chart?.destroy();
			chart = null;
			await createChart();
			return;
		}
		chart.data = data;
		chart.options = (options ?? {}) as ChartOptions;
		chart.update();
	};

	onMount(() => {
		void createChart();
		return () => {
			chart?.destroy();
			chart = null;
			currentType = null;
		};
	});

	$effect(() => {
		void updateChart();
	});
</script>

<div class={className}>
	<canvas bind:this={canvas}></canvas>
</div>
