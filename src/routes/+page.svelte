<script>
	import { Button } from "$lib/components/ui/button/index.js";
	import { USER_LEVELS } from "$lib/constants.js";
	import { CrownIcon } from "@lucide/svelte";

	let { data } = $props();
</script>

<main class="min-h-screen bg-background p-8 pb-28 leading-relaxed text-foreground">
	<div class="mx-auto mb-12 max-w-4xl text-center">
		<div class="mb-8">
			<h1 class="mb-2 text-6xl font-extrabold text-primary sm:text-6xl md:text-9xl">4096</h1>
			<p class="text-2xl font-light text-foreground sm:text-lg md:text-xl">
				{#if data.user}
					Welcome back, {data.user.displayName || data.user.username}!
				{:else}
					The Ultimate Tile-Matching Puzzle Game
				{/if}
			</p>
		</div>
	</div>

	<div class="mx-auto mb-16 flex max-w-md flex-col gap-4">
		<Button href="/game" size="lg" class="w-full justify-center">
			{#if data.hasGame}
				Continue Game
			{:else}
				Start New Game
			{/if}
		</Button>
		{#if data.user}
			<Button href="/account" size="lg" class="w-full justify-center">Your Account</Button>
		{:else}
			<Button href="/login" size="lg" class="w-full justify-center">Login / Create Account</Button>
		{/if}
		{#if data.user?.level !== USER_LEVELS.PRO}
			<Button href="/stripe" size="lg" class="w-full justify-center">
				<CrownIcon size={24} />
				Upgrade to Pro
			</Button>
		{/if}
		<Button href="/challenges" size="lg" class="w-full justify-center">Challenges</Button>
		<Button href="/leaderboard" size="lg" class="w-full justify-center">View Leaderboard</Button>
	</div>

	<div class="mt-12 text-center">
		<p class="m-0 text-foreground">
			Inspired by the original
			<a
				href="https://play2048.co/"
				target="_blank"
				rel="noopener noreferrer"
				class="font-semibold text-primary no-underline hover:underline">2048 game</a
			>, by
			<a
				href="https://github.com/gabrielecirulli"
				target="_blank"
				rel="noopener noreferrer"
				class="font-semibold text-primary no-underline hover:underline"
			>
				Gabriele Cirulli
			</a>
		</p>
	</div>
</main>
