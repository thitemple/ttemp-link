<script lang="ts">
	import { onDestroy } from "svelte";
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
	let ChartJS = $state<(typeof import("chart.js/auto"))["default"] | null>(null);
	let updateTask = Promise.resolve();

	const loadChartJS = async () => {
		if (ChartJS) return ChartJS;
		const module = await import("chart.js/auto");
		ChartJS = module.default;
		return ChartJS;
	};

	const createChart = async () => {
		if (!canvas) return;
		const ChartConstructor = await loadChartJS();
		chart?.destroy();
		chart = new ChartConstructor(canvas, {
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

	onDestroy(() => {
		chart?.destroy();
		chart = null;
		currentType = null;
	});

	$effect(() => {
		void canvas;
		void type;
		void data;
		void options;
		updateTask = updateTask.then(updateChart).catch((error) => {
			console.error("Failed to render chart", error);
		});
	});
</script>

<div class={className}>
	<canvas bind:this={canvas}></canvas>
</div>
