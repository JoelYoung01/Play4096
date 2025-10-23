<script>
	import { enhance } from "$app/forms";
	import { page } from "$app/state";
	import Btn from "$lib/components/Btn.svelte";
	import { CheckIcon, CrownIcon, LoaderCircleIcon } from "@lucide/svelte";
	import { slide } from "svelte/transition";

	let { data, form } = $props();

	let isProcessing = $state(false);
	let error = $state("");
	let disableUpgrade = $derived(
		isProcessing || data.noEmail || data.noEmailVerified || data.alreadyUpgraded
	);

	if (data.noEmail) {
		error = "Please add an email address and verify it before upgrading.";
	} else if (data.noEmailVerified) {
		error = "Please verify your email address before upgrading.";
	}
	if (data.alreadyUpgraded) {
		error = "You are already upgraded.";
	}

	const features = [
		{
			name: "Leaderboard score tracking",
			implemented: true,
		},
		{
			name: "Game History & Replay",
			implemented: false,
		},
		{
			name: "Board Power Ups & Checkpoints",
			implemented: false,
		},
		{
			name: "Exclusive themes and customization",
			implemented: false,
		},
		{
			name: "Cross-platform games",
			implemented: false,
		},
		{
			name: "Challenges",
			implemented: false,
		},
	];

	/** @type {import('./$types').SubmitFunction} */
	async function onSubmit() {
		isProcessing = true;

		return async ({ update }) => {
			await update();
			error = form?.upgrade?.error ?? "";
			isProcessing = false;
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

<div class="h-full overflow-y-auto" style:background-color={page.data.theme?.background}>
	<div class="flex items-center justify-center">
		<div class="mb-[4rem] w-full max-w-md rounded-lg bg-white p-8 text-center">
			<div class="mb-8">
				<h1 class="items-bottom mb-2 flex justify-center gap-2 text-3xl font-bold text-gray-900">
					<CrownIcon size={32} />
					Upgrade to Pro
				</h1>
				<p class="text-gray-600">Unlock advanced features and enhance your 4096 experience</p>
			</div>

			<div class="mb-8">
				<div class="mb-1 rounded-lg border border-orange-200 bg-orange-100 p-6">
					<div class="mb-2 text-4xl font-bold text-orange-600">$5</div>
					<div class="text-sm text-orange-700">One-time payment</div>
				</div>

				<p class="mb-4 text-sm text-gray-400">Features in gray are planned for future releases.</p>

				<div class="space-y-4 text-left">
					{#each features as feature (feature.name)}
						<div class="flex items-center" class:opacity-50={!feature.implemented}>
							<div class="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
								<CheckIcon size={16} />
							</div>
							<span class="text-gray-700">{feature.name}</span>
						</div>
					{/each}
				</div>
			</div>

			<form method="POST" action="/stripe?/upgrade" use:enhance={onSubmit}>
				<Btn
					type="submit"
					class="flex w-full justify-center gap-2 rounded-lg bg-orange-500 px-6 py-3 font-bold text-white transition-colors duration-200 hover:bg-orange-600 disabled:cursor-default disabled:opacity-50"
					disabled={disableUpgrade}
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
				{#if error}
					<p transition:slide class="text-red-500">{error}</p>
				{/if}
			</form>

			<div class="mt-6 text-xs text-gray-500">
				<p>Secure payment powered by Stripe</p>
			</div>
		</div>
	</div>
</div>
