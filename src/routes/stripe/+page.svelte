<script>
	import { enhance } from "$app/forms";
	import { Button } from "$lib/components/ui/button/index.js";
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
		error = "You are already a Pro user.";
	}

	const features = [
		{
			name: "Leaderboard score tracking",
			implemented: true,
		},
		{
			name: "Game History & Replay",
			implemented: true,
		},
		{
			name: "Checkpoints",
			implemented: true,
		},
		{
			name: "Exclusive themes and customization",
			implemented: true,
		},
		{
			name: "Cross-platform games",
			implemented: false,
		},
		{
			name: "Challenges",
			implemented: true,
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

<div class="bg-background pb-28">
	<div class="flex items-center justify-center">
		<div class="mb-[4rem] w-full max-w-md rounded-lg bg-card p-8 text-center text-card-foreground">
			<div class="mb-8">
				<h1 class="items-bottom mb-2 flex justify-center gap-2 text-3xl font-bold text-foreground">
					<CrownIcon size={32} />
					Upgrade to Pro
				</h1>
				<p class="text-muted-foreground">
					Unlock advanced features and enhance your 4096 experience
				</p>
			</div>

			<div class="mb-8">
				<div class="mb-1 rounded-lg border border-primary/20 bg-primary/10 p-6">
					<div class="mb-2 text-4xl font-bold text-primary">$5</div>
					<div class="text-sm text-primary">One-time payment</div>
				</div>

				<p class="mb-4 text-sm text-muted-foreground">
					Features in gray are planned for future releases.
				</p>

				<div class="space-y-4 text-left">
					{#each features as feature (feature.name)}
						<div class="flex items-center" class:opacity-50={!feature.implemented}>
							<div
								class="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary"
							>
								<CheckIcon size={16} />
							</div>
							<span class="text-foreground">{feature.name}</span>
						</div>
					{/each}
				</div>
			</div>

			<form method="POST" action="/stripe?/upgrade" use:enhance={onSubmit}>
				<Button
					type="submit"
					size="lg"
					class="w-full justify-center gap-2"
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
				</Button>
				{#if error}
					<p transition:slide class="text-destructive">{error}</p>
				{/if}
			</form>

			<div class="mt-6 text-xs text-muted-foreground">
				<p>Secure payment powered by Stripe</p>
			</div>
		</div>
	</div>
</div>
