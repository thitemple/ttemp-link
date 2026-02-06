<script lang="ts">
	import { getShareTargets } from "$lib/share";

	let {
		open = false,
		url = "",
		linkId = null,
		heading = "Share link",
		subheading = "Copy the link below or share it with a platform.",
		onClose,
	} = $props<{
		open?: boolean;
		url?: string;
		linkId?: string | null;
		heading?: string;
		subheading?: string;
		onClose?: () => void;
	}>();

	let copiedUrl = $state("");
	const isCopied = $derived.by(() => copiedUrl !== "" && copiedUrl === url);
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;
	const shareTargets = $derived.by(() => getShareTargets(url));

	const closeModal = () => {
		if (onClose) onClose();
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (!open) return;
		if (event.key === "Escape") {
			closeModal();
		}
	};

	const copyLink = async () => {
		if (!url) return;
		try {
			await navigator.clipboard.writeText(url);
			copiedUrl = url;
			if (copyTimeout) {
				clearTimeout(copyTimeout);
			}
			copyTimeout = setTimeout(() => {
				copiedUrl = "";
				copyTimeout = null;
			}, 2000);
		} catch (error) {
			copiedUrl = "";
		}
	};

	const handleCopyShare = async (targetUrl: string) => {
		if (!targetUrl) return;
		await copyLink();
		window.open(targetUrl, "_blank", "noopener,noreferrer");
	};
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-10 backdrop-blur-sm"
	>
		<button class="absolute inset-0" type="button" aria-label="Close modal" onclick={closeModal}
		></button>
		<div
			class="brutal-card relative z-10 w-full max-w-2xl bg-[var(--paper)] p-6 shadow-[10px_10px_0px_#000] sm:p-8"
			role="dialog"
			aria-modal="true"
			aria-labelledby="share-link-title"
			tabindex="-1"
		>
			<div class="flex items-start justify-between gap-4">
				<div>
					<h2 id="share-link-title" class="text-3xl font-semibold">
						{heading}
					</h2>
					<p class="mt-2 text-sm text-[var(--muted)]">{subheading}</p>
				</div>
				<button
					class="grid h-10 w-10 place-items-center rounded-full border-2 border-black bg-white text-xl shadow-[3px_3px_0px_#000] transition-transform duration-150 hover:-translate-y-0.5"
					type="button"
					aria-label="Close modal"
					onclick={closeModal}
				>
					&times;
				</button>
			</div>

			<div
				class="mt-6 rounded-2xl border-2 border-black bg-sky-50 px-6 py-5 shadow-[4px_4px_0px_#000]"
			>
				<a
					class="block truncate text-center text-2xl font-semibold text-primary-600 hover:underline"
					href={url}
					target="_blank"
					rel="noreferrer"
				>
					{url}
				</a>
				<div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
					{#if linkId}
						<a class="brutal-button-secondary w-full sm:w-auto" href={`/links/${linkId}`}>
							View link details
						</a>
					{/if}
					<button class="brutal-button w-full sm:w-auto" type="button" onclick={copyLink}>
						{isCopied ? "Copied" : "Copy link"}
					</button>
				</div>
			</div>

			<div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
				{#each shareTargets as target (target.id)}
					{#if target.kind === "link"}
						<a
							class="group flex flex-col items-center gap-3 rounded-2xl border-2 border-black bg-white px-3 py-4 text-center shadow-[3px_3px_0px_#000] transition-transform duration-150 hover:-translate-y-0.5"
							aria-label={target.label}
							href={target.href}
							target="_blank"
							rel="noreferrer"
						>
							<div
								class="grid h-12 w-12 place-items-center rounded-full border-2 border-black bg-white"
							>
								{#if target.id === "bluesky"}
									<svg class="h-6 w-6 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
										<path
											d="M12 12c-1.3-1.8-4.3-5-6.8-6.4C2.5 4.2 2 4.6 2 6.3c0 2.2.2 7.1 4.6 7.5-2.7.4-4.2 2-4.2 3.1 0 2.8 2.8 3.2 4.8 1.7 1.7-1.3 3.1-3.4 4.8-5.6 1.7 2.2 3.1 4.3 4.8 5.6 2 1.5 4.8 1.1 4.8-1.7 0-1.1-1.5-2.7-4.2-3.1 4.4-.4 4.6-5.3 4.6-7.5 0-1.7-.5-2.1-3.2-.7C16.3 7 13.3 10.2 12 12z"
										/>
									</svg>
								{:else if target.id === "x"}
									<svg class="h-6 w-6 text-black" viewBox="0 0 24 24" fill="currentColor">
										<path
											d="M18.9 3H22l-7.6 8.7L23 21h-6.8l-5.3-6.4L5.5 21H2.4l8.2-9.4L1 3h6.9l4.8 5.7L18.9 3z"
										/>
									</svg>
								{:else if target.id === "facebook"}
									<svg class="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
										<path
											d="M14.5 9.5V7.3c0-1 .7-1.2 1.2-1.2h1.6V3.1l-2.2-.1c-2.4 0-3.6 1.7-3.6 4.4v2H9v3.2h2.5V21h3.1v-8.4h2.6l.4-3.2h-3z"
										/>
									</svg>
								{:else if target.id === "linkedin"}
									<svg class="h-6 w-6 text-sky-700" viewBox="0 0 24 24" fill="currentColor">
										<path
											d="M4.5 3.5A2 2 0 1 1 4.5 7.5 2 2 0 0 1 4.5 3.5zM3 9h3v12H3V9zm7 0h2.9v1.6h.1c.4-.8 1.5-1.7 3.1-1.7 3.3 0 3.9 2.1 3.9 4.9V21h-3v-6.2c0-1.5 0-3.4-2.1-3.4-2.1 0-2.4 1.6-2.4 3.3V21h-3V9z"
										/>
									</svg>
								{:else}
									<svg class="h-6 w-6 text-slate-700" viewBox="0 0 24 24" fill="currentColor">
										<path
											d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm8 7L4 7v10h16V7l-8 5z"
										/>
									</svg>
								{/if}
							</div>
							<span class="sr-only">{target.label}</span>
						</a>
					{:else}
						<button
							class="group flex flex-col items-center gap-3 rounded-2xl border-2 border-black bg-white px-3 py-4 text-center shadow-[3px_3px_0px_#000] transition-transform duration-150 hover:-translate-y-0.5"
							type="button"
							aria-label={target.label}
							onclick={() => handleCopyShare(target.href)}
						>
							<div
								class="grid h-12 w-12 place-items-center rounded-full border-2 border-black bg-white"
							>
								{#if target.id === "instagram"}
									<svg class="h-6 w-6 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
										<path
											d="M12 7.3A4.7 4.7 0 1 0 16.7 12 4.7 4.7 0 0 0 12 7.3zm0 7.7A3 3 0 1 1 15 12a3 3 0 0 1-3 3zm6.1-7.9a1.1 1.1 0 1 1-1.1-1.1 1.1 1.1 0 0 1 1.1 1.1z"
										/>
										<path
											d="M16.9 3H7.1A4.1 4.1 0 0 0 3 7.1v9.8A4.1 4.1 0 0 0 7.1 21h9.8a4.1 4.1 0 0 0 4.1-4.1V7.1A4.1 4.1 0 0 0 16.9 3zm2.4 13.9a2.4 2.4 0 0 1-2.4 2.4H7.1a2.4 2.4 0 0 1-2.4-2.4V7.1a2.4 2.4 0 0 1 2.4-2.4h9.8a2.4 2.4 0 0 1 2.4 2.4z"
										/>
									</svg>
								{:else if target.id === "threads"}
									<svg class="h-6 w-6 text-black" viewBox="0 0 24 24" fill="currentColor">
										<path
											d="M12 3.2a8.8 8.8 0 1 0 8.2 12H15.9c-.5 1.4-2 2.3-3.9 2.3-2.8 0-4.8-1.8-4.8-4.5 0-2.6 1.8-4.4 4.6-4.4 2 0 3.4.8 4.3 2.2l2.1-1.4C16.5 5.8 14.5 4.7 12 4.7c-4 0-6.8 2.7-6.8 6.3 0 3.6 2.7 6.3 6.8 6.3 2.9 0 5.2-1.4 6.1-3.6h-1.9c-.8 1.4-2.4 2.2-4.2 2.2-2.8 0-4.8-1.8-4.8-4.5 0-2.6 1.9-4.4 4.7-4.4 2.5 0 4.3 1.4 4.5 3.6.1.9-.1 1.6-.4 2.1h2.1c.4-.9.6-2 .5-3.2-.2-3.1-2.9-5.6-6.7-5.6z"
										/>
									</svg>
								{:else if target.id === "tiktok"}
									<svg class="h-6 w-6 text-black" viewBox="0 0 24 24" fill="currentColor">
										<path
											d="M15.5 3c.3 2.3 1.9 4 4.2 4.3v3.1c-1.8.1-3.4-.5-4.7-1.5v6.5c0 3.3-2.7 5.6-5.9 5.6a5.6 5.6 0 0 1-5.6-5.6c0-3.1 2.4-5.6 5.6-5.6.5 0 1 .1 1.5.2v3.2a2.4 2.4 0 0 0-1.5-.5 2.4 2.4 0 1 0 2.4 2.4V3h4z"
										/>
									</svg>
								{:else}
									<svg class="h-6 w-6 text-rose-500" viewBox="0 0 24 24" fill="currentColor">
										<path
											d="M12 3a7.8 7.8 0 0 0-7.8 7.8v4.5A5.7 5.7 0 0 0 9.9 21h.6V14H8.2v-3h2.3v-1c0-2.3 1.4-3.6 3.5-3.6.7 0 1.5.1 1.5.1v2h-.8c-.8 0-1.1.5-1.1 1.1v1.4h2.4l-.4 3h-2v7h.4a5.7 5.7 0 0 0 5.7-5.7v-4.5A7.8 7.8 0 0 0 12 3z"
										/>
									</svg>
								{/if}
							</div>
							<span class="sr-only">{target.label}</span>
						</button>
					{/if}
				{/each}
			</div>
		</div>
	</div>
{/if}
