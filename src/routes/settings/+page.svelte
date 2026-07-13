<script>
	import { page } from "$app/state";
	import Btn from "$lib/components/Btn.svelte";
	import {
		DEFAULT_TILE_ANIMATION_SPEED,
		MAX_TILE_ANIMATION_SPEED,
		MIN_TILE_ANIMATION_SPEED,
	} from "$lib/constants.js";
	import { setTileAnimationSpeed, userSettings } from "$lib/userSettings.svelte.js";

	let speed = $state(userSettings.tileAnimationSpeed);

	$effect(() => {
		setTileAnimationSpeed(speed);
	});

	const speedLabel = $derived.by(() => {
		if (speed === 0) return "Instant";
		if (speed === DEFAULT_TILE_ANIMATION_SPEED) return "Default";
		if (speed === MAX_TILE_ANIMATION_SPEED) return "Maximum";
		return `${speed}`;
	});
</script>

<main class="mx-auto mt-10 w-full max-w-md p-8" style:color={page.data.theme?.primary}>
	<h1 class="mb-2 text-3xl font-bold">Settings</h1>
	<p class="mb-6 text-sm text-gray-500">Customize how the game looks and feels on this device.</p>

	<section class="rounded-xl p-4" style:background-color={page.data.theme?.boardBackground}>
		<div class="mb-3 flex items-center justify-between gap-4">
			<div>
				<h2 class="text-lg font-bold" style:color={page.data.theme?.textDark}>
					Tile Animation Speed
				</h2>
				<p class="text-sm" style:color={page.data.theme?.textDark}>
					Controls tile movement and fade-in together.
				</p>
			</div>
			<span
				class="rounded-md px-2 py-1 text-sm font-bold"
				style:background-color={page.data.theme?.emptyTile}
				style:color={page.data.theme?.textDark}
			>
				{speedLabel}
			</span>
		</div>

		<input
			class="speed-slider w-full"
			type="range"
			min={MIN_TILE_ANIMATION_SPEED}
			max={MAX_TILE_ANIMATION_SPEED}
			step="1"
			bind:value={speed}
			aria-label="Tile animation speed"
		/>

		<div
			class="mt-2 flex justify-between text-xs font-semibold"
			style:color={page.data.theme?.textDark}
		>
			<span>Instant (0)</span>
			<span>Default ({DEFAULT_TILE_ANIMATION_SPEED})</span>
			<span>Fast ({MAX_TILE_ANIMATION_SPEED})</span>
		</div>
	</section>

	<div class="mt-6">
		<Btn class="px-4 py-2" href="/game">Back to Game</Btn>
	</div>
</main>

<style lang="postcss">
	.speed-slider {
		accent-color: var(--color-primary);
	}
</style>
