<script>
	import BasicBoard from "$lib/BasicBoard.svelte";

	let { game, pendingEvents, newGame, removeEvent } = $props();

	const width = 400;
	const height = 400;
</script>

<canvas {width} {height}>
	<BasicBoard {game} {newGame} />
</canvas>
