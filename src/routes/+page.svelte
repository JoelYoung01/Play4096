<script>
	import { page } from "$app/state";
	import Btn from "$lib/components/Btn.svelte";
</script>

<main
	class="min-h-screen p-8 leading-relaxed"
	style:background-color={page.data.theme?.background}
	style:color={page.data.theme?.text}
>
	<div class="mx-auto mb-12 max-w-4xl text-center">
		<div class="mb-8">
			<h1 class="mb-2 text-6xl font-extrabold text-[var(--primary-color)] sm:text-6xl md:text-9xl">
				4096
			</h1>
			<p class="text-2xl font-light text-[var(--text-color)] sm:text-lg md:text-xl">
				The Ultimate Tile-Matching Puzzle Game
			</p>
		</div>
	</div>

	<div class="mx-auto mb-16 flex max-w-md flex-col gap-4">
		<Btn href="/game" class="text-center">Start New Game</Btn>
		<Btn href="/login" class="text-center">Login / Create Account</Btn>
		<Btn href="/leaderboard" class="text-center">View Leaderboard</Btn>
	</div>

	<div class="mt-12 text-center">
		<p class="m-0 text-[var(--text-color)]">
			Inspired by the original
			<a
				href="https://play2048.co/"
				target="_blank"
				rel="noopener noreferrer"
				class="font-semibold text-[var(--primary-color)] no-underline hover:underline">2048 game</a
			>, by
			<a
				href="https://github.com/gabrielecirulli"
				target="_blank"
				rel="noopener noreferrer"
				class="font-semibold text-[var(--primary-color)] no-underline hover:underline"
				>Gabriele Cirulli</a
			>
		</p>
	</div>
</main>
