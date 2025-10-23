<script>
	import { CheckIcon, InfoIcon, TriangleAlertIcon } from "@lucide/svelte";
	import { slide } from "svelte/transition";

	/** @type {{ type?: "info" | "success" | "warning" | "danger", duration?: number, show?: boolean, children: import('svelte').Snippet }} */
	let { type = "info", duration = 3000, show = $bindable(true), children } = $props();

	// Automatically hide the alert after the duration
	$effect(() => {
		if (show && duration > 0) {
			const timeout = setTimeout(() => {
				show = false;
			}, duration);

			return () => clearTimeout(timeout);
		}
	});

	const alertConfig = {
		info: {
			icon: InfoIcon,
			borderColor: "border-blue-400",
			bgColor: "bg-blue-100",
			progressBg: "bg-blue-200",
			progressBar: "bg-blue-600",
			iconColor: "text-blue-600",
		},
		success: {
			icon: CheckIcon,
			borderColor: "border-green-400",
			bgColor: "bg-green-100",
			progressBg: "bg-green-200",
			progressBar: "bg-green-600",
			iconColor: "text-green-600",
		},
		warning: {
			icon: TriangleAlertIcon,
			borderColor: "border-yellow-400",
			bgColor: "bg-yellow-100",
			progressBg: "bg-yellow-200",
			progressBar: "bg-yellow-600",
			iconColor: "text-yellow-600",
		},
		danger: {
			icon: TriangleAlertIcon,
			borderColor: "border-red-400",
			bgColor: "bg-red-100",
			progressBg: "bg-red-200",
			progressBar: "bg-red-600",
			iconColor: "text-red-600",
		},
	};

	const config = alertConfig[type];
	const Icon = config.icon;
</script>

{#if show}
	<div
		transition:slide
		class="mb-3 overflow-hidden rounded-md border {config.borderColor} {config.bgColor}"
	>
		<div class="flex items-center gap-2 p-4">
			<Icon size={24} class={config.iconColor} />
			{@render children()}
		</div>
		{#if duration > 0}
			<div class="h-1 w-full {config.progressBg}">
				<div
					class="progress-bar h-full {config.progressBar}"
					style="animation-duration: {duration}ms;"
				></div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.progress-bar {
		width: 0;
		animation-name: progress;
		animation-timing-function: linear;
		animation-fill-mode: forwards;
	}

	@keyframes progress {
		from {
			width: 0%;
		}
		to {
			width: 100%;
		}
	}
</style>
