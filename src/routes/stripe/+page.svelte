<script>
	import { enhance } from "$app/forms";
	import { page } from "$app/state";
	import Btn from "$lib/components/Btn.svelte";
	import { CheckIcon, LoaderCircleIcon } from "@lucide/svelte";

	let isProcessing = $state(false);
	let error = $state("");

	const features = [
		"Leaderboard score tracking",
		// "Unlimited game replays",
		// "Exclusive themes and customization",
		// "Cross-platform games",
		// "Challenges",
		"All planned features",
	];

	/** @type {import('./$types').SubmitFunction} */
	async function onSubmit() {
		isProcessing = true;

		return ({ update }) => {
			isProcessing = false;
			update();
		};
	}
</script>

<svelte:head>
	<title>Upgrade to Pro - 4096</title>
	<meta
		name="description"
		content="Upgrade to 4096 Pro for advanced features and enhanced gameplay experience."
	/>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center p-4"
	style:background-color={page.data.theme?.background}
>
	<div class="w-full max-w-md rounded-lg bg-white p-8 text-center">
		<div class="mb-8">
			<h1 class="mb-2 text-3xl font-bold text-gray-900">Upgrade to Pro</h1>
			<p class="text-gray-600">Unlock advanced features and enhance your 4096 experience</p>
		</div>

		<div class="mb-8">
			<div class="mb-6 rounded-lg border border-orange-200 bg-orange-100 p-6">
				<div class="mb-2 text-4xl font-bold text-orange-600">$5</div>
				<div class="text-sm text-orange-700">One-time payment</div>
			</div>

			<div class="space-y-4 text-left">
				{#each features as feature, key (key)}
					<div class="flex items-center">
						<div class="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
							<CheckIcon size={16} />
						</div>
						<span class="text-gray-700">{feature}</span>
					</div>
				{/each}
			</div>
		</div>

		{#if error}
			<div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
				<p class="text-sm text-red-700">{error}</p>
			</div>
		{/if}

		<form method="POST" action="/stripe?/upgrade" use:enhance={onSubmit}>
			<Btn
				type="submit"
				class="w-full rounded-lg bg-orange-500 px-6 py-3 font-bold text-white transition-colors duration-200 hover:bg-orange-600 disabled:cursor-default disabled:opacity-50"
				disabled={isProcessing}
			>
				{#if isProcessing}
					<div class="flex items-center justify-center">
						<LoaderCircleIcon class="me-1 animate-spin" size={16} />
						Processing...
					</div>
				{:else}
					Upgrade to Pro - $5
				{/if}
			</Btn>
		</form>

		<div class="mt-6 text-xs text-gray-500">
			<p>Secure payment powered by Stripe</p>
		</div>
	</div>
</div>
