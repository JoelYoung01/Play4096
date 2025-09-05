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

<main
	class="min-h-screen bg-gradient-to-br from-[#fbf8ef] to-[#f2f0e6] p-8 font-sans leading-relaxed text-[#776e65]"
	style:background-color={page.data.theme?.background}
>
	<div class="mx-auto mb-12 max-w-4xl text-center">
		<div class="mb-8">
			<h1 class="mb-2 text-6xl font-bold text-[#ec995b] drop-shadow-sm sm:text-4xl md:text-5xl">
				4096
			</h1>
			<p class="text-2xl font-light text-[#776e65] sm:text-lg md:text-xl">
				The Ultimate Tile-Matching Puzzle Game
			</p>
		</div>

		<div class="mx-auto max-w-2xl text-lg text-[#776e65] md:text-base">
			<p>
				Join the numbered tiles and get to <strong class="text-[#ec995b]">4096</strong>! This
				challenging puzzle game combines strategy and quick thinking. Use your arrow keys or swipe
				to move tiles. When two tiles with the same number touch, they merge into one!
			</p>
		</div>
	</div>

	<div class="mx-auto mb-16 flex max-w-md flex-col gap-4">
		<button
			class="text-decoration-none flex min-h-[60px] cursor-pointer items-center justify-center gap-3 rounded-lg border-none bg-[#ec995b] px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#e88f4f] hover:shadow-xl"
			onclick={startNewGame}
		>
			Start New Game
		</button>

		<button
			class="text-decoration-none flex min-h-[60px] cursor-pointer items-center justify-center gap-3 rounded-lg border-2 border-none border-[#ec995b] bg-white px-8 py-4 text-lg font-semibold text-[#ec995b] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#ec995b] hover:text-white hover:shadow-lg"
			onclick={goToLogin}
		>
			Login / Create Account
		</button>

		<button
			class="text-decoration-none flex min-h-[60px] cursor-pointer items-center justify-center gap-3 rounded-lg border-2 border-none border-[#ec995b] bg-white px-8 py-4 text-lg font-semibold text-[#ec995b] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#ec995b] hover:text-white hover:shadow-lg"
			onclick={goToLeaderboard}
		>
			View Leaderboard
		</button>
	</div>

	<div class="mx-auto mb-16 max-w-5xl px-4">
		<h2 class="mb-8 text-center text-3xl text-[#ec995b] md:text-2xl">Game Features</h2>
		<div class="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
			<div
				class="rounded-xl bg-white p-8 text-center shadow-lg transition-transform duration-300 hover:-translate-y-1"
			>
				<div class="mb-4 text-5xl">🎯</div>
				<h3 class="mb-4 text-xl text-[#ec995b]">Challenge Yourself</h3>
				<p class="m-0 text-[#776e65]">
					Reach the ultimate goal of 4096 tiles in this strategic puzzle game
				</p>
			</div>
			<div
				class="rounded-xl bg-white p-8 text-center shadow-lg transition-transform duration-300 hover:-translate-y-1"
			>
				<div class="mb-4 text-5xl">🏆</div>
				<h3 class="mb-4 text-xl text-[#ec995b]">Global Leaderboards</h3>
				<p class="m-0 text-[#776e65]">Compete with players worldwide and see how you rank</p>
			</div>
			<div
				class="rounded-xl bg-white p-8 text-center shadow-lg transition-transform duration-300 hover:-translate-y-1"
			>
				<div class="mb-4 text-5xl">💾</div>
				<h3 class="mb-4 text-xl text-[#ec995b]">Save Progress</h3>
				<p class="m-0 text-[#776e65]">
					Create an account to save your games and track your progress
				</p>
			</div>
			<div
				class="rounded-xl bg-white p-8 text-center shadow-lg transition-transform duration-300 hover:-translate-y-1"
			>
				<div class="mb-4 text-5xl">📱</div>
				<h3 class="mb-4 text-xl text-[#ec995b]">Mobile Friendly</h3>
				<p class="m-0 text-[#776e65]">
					Play on any device with touch controls and responsive design
				</p>
			</div>
		</div>
	</div>

	<div class="mx-auto mb-16 max-w-5xl px-4">
		<h2 class="mb-8 text-center text-3xl text-[#ec995b] md:text-2xl">About 4096</h2>
		<div class="mb-6 text-center text-lg">
			<p>
				4096 is inspired by the popular
				<a
					href="https://play2048.co/"
					target="_blank"
					rel="noopener noreferrer"
					class="font-semibold text-[#ec995b] no-underline hover:underline">2048 game</a
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

	<div class="mx-auto mb-16 max-w-5xl px-4">
		<h2 class="mb-8 text-center text-3xl text-[#ec995b] md:text-2xl">How to Play</h2>
		<div class="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
			<div class="flex items-start gap-4 rounded-xl bg-white p-8 shadow-lg">
				<div
					class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#ec995b] font-bold text-white"
				>
					1
				</div>
				<div class="flex-1">
					<h3 class="mb-2 text-xl text-[#ec995b]">Move Tiles</h3>
					<p class="m-0 text-[#776e65]">
						Use arrow keys (desktop) or swipe gestures (mobile) to move all tiles in one direction
					</p>
				</div>
			</div>
			<div class="flex items-start gap-4 rounded-xl bg-white p-8 shadow-lg">
				<div
					class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#ec995b] font-bold text-white"
				>
					2
				</div>
				<div class="flex-1">
					<h3 class="mb-2 text-xl text-[#ec995b]">Merge Tiles</h3>
					<p class="m-0 text-[#776e65]">
						When two tiles with the same number touch, they merge into one tile with double the
						value
					</p>
				</div>
			</div>
			<div class="flex items-start gap-4 rounded-xl bg-white p-8 shadow-lg">
				<div
					class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#ec995b] font-bold text-white"
				>
					3
				</div>
				<div class="flex-1">
					<h3 class="mb-2 text-xl text-[#ec995b]">Reach 4096</h3>
					<p class="m-0 text-[#776e65]">
						Keep merging tiles strategically to reach the ultimate goal of 4096!
					</p>
				</div>
			</div>
		</div>
	</div>

	<div class="mt-12 border-t border-[#ec995b]/20 pt-8 text-center">
		<p class="m-0 text-[#776e65]">
			Inspired by the original
			<a
				href="https://play2048.co/"
				target="_blank"
				rel="noopener noreferrer"
				class="font-semibold text-[#ec995b] no-underline hover:underline">2048 game</a
			>
		</p>
	</div>
</main>
