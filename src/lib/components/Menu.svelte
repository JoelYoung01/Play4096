<script>
	import { fly } from "svelte/transition";
	import { cubicOut } from "svelte/easing";

	/**
	 * @typedef {Object} Props
	 * @property {boolean} open - Controls whether the menu is open or closed (2-way bindable)
	 * @property {import('svelte').Snippet} [activator] - Snippet for the menu activator/trigger
	 * @property {import('svelte').Snippet} [content] - Snippet for the menu content
	 */

	/** @type {Props} */
	let { open = $bindable(false), activator, content } = $props();

	/** @type {HTMLElement | null} */
	let menuRef = $state(null);
	/** @type {HTMLElement | null} */
	let activatorRef = $state(null);

	// Close menu when clicking outside
	/**
	 * @param {MouseEvent} event
	 */
	function handleClickOutside(event) {
		const target = /** @type {Node} */ (event.target);
		if (menuRef && activatorRef && !menuRef.contains(target) && !activatorRef.contains(target)) {
			open = false;
		}
	}

	// Toggle menu open/closed
	function toggleMenu() {
		open = !open;
	}

	// Handle keyboard events for accessibility
	/**
	 * @param {KeyboardEvent} event
	 */
	function handleKeydown(event) {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			toggleMenu();
		}
	}

	$effect(() => {
		if (open) {
			document.addEventListener("click", handleClickOutside, true);
			return () => {
				document.removeEventListener("click", handleClickOutside, true);
			};
		}
	});
</script>

<div class="relative inline-block">
	<!-- Menu Activator (Button/Trigger) -->
	<div
		bind:this={activatorRef}
		onclick={toggleMenu}
		onkeydown={handleKeydown}
		role="button"
		tabindex="0"
	>
		{#if activator}
			{@render activator()}
		{/if}
	</div>

	<!-- Menu Content -->
	{#if open}
		<div
			bind:this={menuRef}
			class="absolute left-0 z-50 mt-2 flex flex-col gap-2"
			transition:fly={{ y: -10, duration: 200, easing: cubicOut }}
		>
			{#if content}
				{@render content()}
			{/if}
		</div>
	{/if}
</div>
