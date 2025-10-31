<script>
	import { fade, fly } from "svelte/transition";

	/**
	 * @typedef {Object} Props
	 * @property {boolean} show - Controls overlay visibility (two-way bindable)
	 * @property {boolean} [persistent] - If true, prevents dismissal and shows pulse animation on attempt
	 * @property {import('svelte').Snippet} [children] - Overlay content
	 */

	/** @type {Props} */
	let { show = $bindable(false), persistent = false, children } = $props();

	let isPulsing = $state(false);

	/**
	 * Trigger pulse animation
	 */
	function triggerPulse() {
		isPulsing = true;
		setTimeout(() => {
			isPulsing = false;
		}, 100);
	}

	/**
	 * Close overlay when clicking on the backdrop
	 * @param {MouseEvent} e
	 */
	function handleBackdropClick(e) {
		if (e.target === e.currentTarget) {
			if (persistent) {
				triggerPulse();
			} else {
				show = false;
			}
		}
	}

	/**
	 * Close overlay on Escape key
	 * @param {KeyboardEvent} e
	 */
	function handleKeydown(e) {
		if (e.key === "Escape") {
			if (persistent) {
				triggerPulse();
			} else {
				show = false;
			}
		}
	}
</script>

{#if show}
	<div
		role="dialog"
		aria-modal="true"
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		tabindex="-1"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="relative max-h-full w-full max-w-2xl overflow-auto transition-transform duration-200 {isPulsing
				? 'scale-102'
				: 'scale-100'}"
			transition:fly={{ y: -50, duration: 300 }}
		>
			{@render children?.()}
		</div>
	</div>
{/if}
