<script>
	import { page } from "$app/state";

	import Btn from "$lib/components/Btn.svelte";
	import { USER_LEVELS } from "$lib/constants.js";
	import { CrownIcon } from "@lucide/svelte";

	let { data } = $props();
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
				{#if data.user}
					Welcome back, {data.user.displayName || data.user.username}!
				{:else}
					The Ultimate Tile-Matching Puzzle Game
				{/if}
			</p>
		</div>
	</div>

	<div class="mx-auto mb-16 flex max-w-md flex-col gap-4">
		<Btn href="/game" class="justify-center">
			{#if data.hasGame}
				Continue Game
			{:else}
				Start New Game
			{/if}
		</Btn>
		{#if data.user}
			<Btn href="/account" class="justify-center">Your Account</Btn>
		{:else}
			<Btn href="/login" class="justify-center">Login / Create Account</Btn>
		{/if}
		{#if data.user?.level !== USER_LEVELS.PRO}
			<Btn href="/stripe" class="justify-center">
				<CrownIcon size={24} />
				Upgrade to Pro
			</Btn>
		{/if}
		<Btn href="/leaderboard" class="justify-center">View Leaderboard</Btn>
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
			>
				Gabriele Cirulli
			</a>
		</p>
	</div>
</main>
