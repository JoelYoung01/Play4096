<script>
	import { saveBestScore } from "$lib/localStorage.svelte";
	import { gameState } from "./state.svelte";

	let { children } = $props();

	// Save best score to localstorage whenever it changes
	$effect(() => {
		saveBestScore(gameState.bestScore);
	});
</script>

{@render children?.()}
