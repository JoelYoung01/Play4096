<script>
	import { goto } from "$app/navigation";
	import { page } from "$app/state";

	// Navigation functions
	function startNewGame() {
		goto("/game");
	}

	function goToLogin() {
		goto("/login");
	}

	function goToLeaderboard() {
		goto("/leaderboard");
	}
</script>

<main class="home-main" style:background-color={page.data.theme?.background}>
	<div class="mx-auto mb-12 max-w-4xl text-center">
		<div class="mb-8">
			<h1 class="game-title">4096</h1>
			<p class="game-subtitle">The Ultimate Tile-Matching Puzzle Game</p>
		</div>

		<div class="game-description">
			<p>
				Join the numbered tiles and get to <strong class="text-primary">4096</strong>! This
				challenging puzzle game combines strategy and quick thinking. Use your arrow keys or swipe
				to move tiles. When two tiles with the same number touch, they merge into one!
			</p>
		</div>
	</div>

	<div class="action-buttons">
		<button class="primary-button" onclick={startNewGame}>
			<span class="button-icon">🎮</span>
			Start New Game
		</button>

		<button class="secondary-button" onclick={goToLogin}>
			<span class="button-icon">👤</span>
			Login / Create Account
		</button>

		<button class="secondary-button" onclick={goToLeaderboard}>
			<span class="button-icon">🏆</span>
			View Leaderboard
		</button>
	</div>

	<div class="features-section">
		<h2 class="section-title">Game Features</h2>
		<div class="features-grid">
			<div class="feature-card">
				<div class="feature-icon">🎯</div>
				<h3 class="feature-title">Challenge Yourself</h3>
				<p class="feature-text">
					Reach the ultimate goal of 4096 tiles in this strategic puzzle game
				</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">🏆</div>
				<h3 class="feature-title">Global Leaderboards</h3>
				<p class="feature-text">Compete with players worldwide and see how you rank</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">💾</div>
				<h3 class="feature-title">Save Progress</h3>
				<p class="feature-text">Create an account to save your games and track your progress</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">📱</div>
				<h3 class="feature-title">Mobile Friendly</h3>
				<p class="feature-text">Play on any device with touch controls and responsive design</p>
			</div>
		</div>
	</div>

	<div class="about-section">
		<h2 class="section-title">About 4096</h2>
		<div class="about-content">
			<p>
				4096 is inspired by the popular
				<a
					href="https://play2048.co/"
					target="_blank"
					rel="noopener noreferrer"
					class="external-link">2048 game</a
				>
				created by Gabriele Cirulli. Our version takes the classic tile-matching concept to the next
				level with enhanced features including user accounts, leaderboards, and game replays.
			</p>
			<p>
				The goal is simple: combine tiles with the same numbers to create larger tiles. Start with
				tiles numbered 2 and work your way up to the ultimate challenge of reaching 4096!
			</p>
		</div>
	</div>

	<div class="how-to-play">
		<h2 class="section-title">How to Play</h2>
		<div class="instructions-grid">
			<div class="instruction-step">
				<div class="step-number">1</div>
				<div class="step-content">
					<h3 class="step-title">Move Tiles</h3>
					<p class="step-text">
						Use arrow keys (desktop) or swipe gestures (mobile) to move all tiles in one direction
					</p>
				</div>
			</div>
			<div class="instruction-step">
				<div class="step-number">2</div>
				<div class="step-content">
					<h3 class="step-title">Merge Tiles</h3>
					<p class="step-text">
						When two tiles with the same number touch, they merge into one tile with double the
						value
					</p>
				</div>
			</div>
			<div class="instruction-step">
				<div class="step-number">3</div>
				<div class="step-content">
					<h3 class="step-title">Reach 4096</h3>
					<p class="step-text">
						Keep merging tiles strategically to reach the ultimate goal of 4096!
					</p>
				</div>
			</div>
		</div>
	</div>

	<div class="footer-links">
		<p class="footer-text">
			Inspired by the original
			<a href="https://play2048.co/" target="_blank" rel="noopener noreferrer" class="external-link"
				>2048 game</a
			>
		</p>
	</div>
</main>

<style lang="postcss">
	.home-main {
		min-height: 100vh;
		padding: 2rem;
		font-family: "Arial", sans-serif;
		color: var(--text-color);
		background: linear-gradient(135deg, var(--background-color) 0%, #f2f0e6 100%);
		line-height: 1.6;
	}

	.game-title {
		font-size: 4rem;
		font-weight: bold;
		color: var(--primary-color);
		margin: 0 0 0.5rem 0;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
	}

	.game-subtitle {
		font-size: 1.5rem;
		color: var(--text-color);
		margin: 0;
		font-weight: 300;
	}

	.game-description {
		font-size: 1.1rem;
		max-width: 600px;
		margin: 0 auto;
		color: var(--text-color);
	}

	.text-primary {
		color: var(--primary-color);
	}

	.action-buttons {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 400px;
		margin: 0 auto 4rem auto;
	}

	.primary-button,
	.secondary-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 1rem 2rem;
		border: none;
		border-radius: 8px;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		text-decoration: none;
		min-height: 60px;
	}

	.primary-button {
		background: var(--primary-color);
		color: white;
		box-shadow: 0 4px 12px rgba(143, 122, 102, 0.3);
	}

	.primary-button:hover {
		background: var(--primary-color-dark);
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(143, 122, 102, 0.4);
	}

	.secondary-button {
		background: white;
		color: var(--primary-color);
		border: 2px solid var(--primary-color);
	}

	.secondary-button:hover {
		background: var(--primary-color);
		color: white;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(143, 122, 102, 0.2);
	}

	.button-icon {
		font-size: 1.2rem;
	}

	.features-section,
	.about-section,
	.how-to-play {
		max-width: 1000px;
		margin: 0 auto 4rem auto;
		padding: 0 1rem;
	}

	.section-title {
		text-align: center;
		font-size: 2rem;
		color: var(--primary-color);
		margin-bottom: 2rem;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
		margin-top: 2rem;
	}

	.feature-card {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		text-align: center;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transition: transform 0.3s ease;
	}

	.feature-card:hover {
		transform: translateY(-4px);
	}

	.feature-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.feature-title {
		font-size: 1.3rem;
		color: var(--primary-color);
		margin-bottom: 1rem;
	}

	.feature-text {
		color: var(--text-color);
		margin: 0;
	}

	.about-content {
		font-size: 1.1rem;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.external-link {
		color: var(--primary-color);
		text-decoration: none;
		font-weight: 600;
	}

	.external-link:hover {
		text-decoration: underline;
	}

	.instructions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin-top: 2rem;
	}

	.instruction-step {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		background: white;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.step-number {
		background: var(--primary-color);
		color: white;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		flex-shrink: 0;
	}

	.step-title {
		color: var(--primary-color);
		margin: 0 0 0.5rem 0;
		font-size: 1.2rem;
	}

	.step-text {
		margin: 0;
		color: var(--text-color);
	}

	.footer-links {
		text-align: center;
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid rgba(143, 122, 102, 0.2);
	}

	.footer-text {
		margin: 0;
		color: var(--text-color);
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.home-main {
			padding: 1rem 0.5rem;
		}

		.game-title {
			font-size: 3rem;
		}

		.game-subtitle {
			font-size: 1.2rem;
		}

		.game-description {
			font-size: 1rem;
		}

		.action-buttons {
			max-width: 100%;
		}

		.primary-button,
		.secondary-button {
			padding: 0.875rem 1.5rem;
			font-size: 1rem;
		}

		.features-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.feature-card {
			padding: 1.5rem;
		}

		.instructions-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.instruction-step {
			padding: 1.5rem;
		}
	}

	@media (max-width: 480px) {
		.game-title {
			font-size: 2.5rem;
		}

		.game-subtitle {
			font-size: 1rem;
		}

		.section-title {
			font-size: 1.5rem;
		}
	}
</style>
