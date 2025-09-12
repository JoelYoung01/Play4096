<script>
	import { saveBestScore } from "$lib/localStorage.svelte";
	import { gameState } from "./state.svelte";

	let { children } = $props();

	// Save best score to localstorage whenever it changes
	$effect(() => {
		saveBestScore(gameState.bestScore);
	});
</script>

<div class="game-container">
	{@render children?.()}
</div>

<style>
	.game-container {
		/* Prevent Chrome's pull-to-refresh and other touch gestures */
		touch-action: none;
		user-select: none;
		overscroll-behavior: contain;
		/* Additional gesture prevention */
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		-webkit-overflow-scrolling: touch;
		-webkit-overscroll-behavior: contain;
		-webkit-tap-highlight-color: transparent;
		-webkit-touch-callout: none;
		-webkit-user-drag: none;
		-khtml-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		-khtml-user-drag: none;
		-moz-user-drag: none;
		-o-user-drag: none;
	}
</style>
