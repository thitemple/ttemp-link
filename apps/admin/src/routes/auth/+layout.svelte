<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-screen bg-[var(--bg)]">
	{@render children()}
</div>
