<script>
	let { game, newGame, continuePlaying } = $props();

	let showGameOver = $state(false);
	let showWin = $state(false);

	$effect(() => {
		if (game.gameOver) {
			setTimeout(() => {
				showGameOver = true;
			}, 1000);
		}
		if (game.won && !game.canContinue) {
			setTimeout(() => {
				showWin = true;
			}, 1000);
		}
	});

	function handleNewGame() {
		showGameOver = false;
		showWin = false;
		newGame();
	}
</script>

<!-- Game Overlay -->
{#if showGameOver}
	<div class="overlay game-over">
		<div class="overlay-content">
			<h2>Game Over!</h2>
			<p>Final Score: {game.score}</p>
			<button class="overlay-btn" onclick={handleNewGame}>Try Again</button>
		</div>
	</div>
{/if}

{#if showWin}
	<div class="overlay win">
		<div class="overlay-content">
			<h2>You Won!</h2>
			<p>Score: {game.score}</p>
			<button class="overlay-btn" onclick={continuePlaying}>Keep Playing</button>
			<button class="overlay-btn secondary" onclick={handleNewGame}>New Game</button>
		</div>
	</div>
{/if}

<style lang="postcss">
	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.overlay-content {
		background: white;
		padding: 40px;
		border-radius: 12px;
		text-align: center;
		max-width: 400px;
	}

	.overlay-content h2 {
		margin: 0 0 20px 0;
		color: #776e65;
		font-size: 2rem;
	}

	.overlay-content p {
		margin: 0 0 30px 0;
		color: #776e65;
		font-size: 1.2rem;
	}

	.overlay-btn {
		background: #8f7a66;
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: bold;
		cursor: pointer;
		margin: 0 10px 10px 0;
		transition: background-color 0.2s;
	}

	.overlay-btn:hover {
		background: #7f6a56;
	}

	.overlay-btn.secondary {
		background: #bbada0;
	}

	.overlay-btn.secondary:hover {
		background: #ab9d90;
	}
</style>
