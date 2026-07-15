<script>
	import { enhance } from "$app/forms";
	import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { clearBestScore, clearGame } from "$lib/localStorage.svelte";
	import {
		LogOutIcon,
		PencilIcon,
		TrashIcon,
		CrownIcon,
		MailIcon,
		LockIcon,
		PaletteIcon,
	} from "@lucide/svelte";
	import { USER_LEVELS } from "$lib/constants";
	import { gameState } from "../game/state.svelte";
	import { goto } from "$app/navigation";

	let { data, form } = $props();

	let loadingVerifyEmail = $state(false);
	let deleteDialogOpen = $state(false);
	let warnProNoEmail = $derived(data.proNoEmail);

	function clearUserData() {
		clearGame();
		clearBestScore();

		gameState.bestScore = 0;
		gameState.currentGame = null;
	}

	/** @type {import('./$types').SubmitFunction} */
	function onResendVerificationEmail() {
		loadingVerifyEmail = true;

		return async ({ update }) => {
			await update();

			if (form?.sendEmail?.success) {
				goto("/verify-email");
			} else {
				loadingVerifyEmail = false;
			}
		};
	}

	/** @type {import('./$types').SubmitFunction} */
	function onLogout() {
		return async ({ update }) => {
			// Reset game state
			clearUserData();

			await update();
		};
	}

	/** @type {import('./$types').SubmitFunction} */
	function onDeleteAccount() {
		// Reset game state
		clearUserData();

		return async ({ update }) => {
			await update();
		};
	}
</script>

<main class="mx-auto mt-10 w-full max-w-md p-8 pb-28 text-foreground">
	<h1 class="flex items-center gap-2 text-3xl font-bold">
		Account
		{#if data.userProfile.level === USER_LEVELS.PRO}
			<Badge class="gap-1">
				<CrownIcon size={12} />
				Pro
			</Badge>
		{/if}
	</h1>
	<p class="mb-4 text-sm text-muted-foreground">
		Hello, {data.userProfile.displayName || data.userProfile.username}!
	</p>

	<dl class="mb-4 text-muted-foreground">
		<dt class="font-bold text-foreground">Display Name</dt>
		<dd class="mb-2">{data.userProfile.displayName || data.userProfile.username}</dd>
		<dt class="font-bold text-foreground">Email</dt>
		<dd class="mb-2">
			{#if data.userProfile.email}
				{data.userProfile.email}
				{#if data.userProfile.emailVerified}
					<span class="text-primary">(Verified)</span>
				{:else}
					<span class="text-destructive">(Unverified)</span>
				{/if}
			{:else}
				<span class="text-muted-foreground">None</span>
			{/if}
		</dd>
	</dl>

	{#if warnProNoEmail}
		<p class="mb-4 text-sm text-destructive">
			It is recommended to add an email address and verify it as a Pro User, as it will make it
			easier to recover your account if you forget your password.
		</p>
	{/if}

	<div class="flex flex-col gap-2">
		<Button class="flex w-60 gap-2" href="/account/edit-details">
			<div class="flex flex-1/6 items-center justify-end">
				<PencilIcon size={18} />
			</div>
			<div class="flex-5/6 text-start">Edit Profile</div>
		</Button>
		<Button class="flex w-60 gap-2" href="/themes">
			<div class="flex flex-1/6 items-center justify-end">
				<PaletteIcon size={18} />
			</div>
			<div class="flex-5/6 text-start">Themes</div>
		</Button>
		{#if data.userProfile.level !== USER_LEVELS.PRO}
			<Button class="flex w-60 gap-2" href="/stripe" variant="secondary">
				<div class="flex flex-1/6 items-center justify-end">
					<CrownIcon size={18} />
				</div>
				<div class="flex-5/6 text-start">Upgrade to Pro</div>
			</Button>
		{/if}
		<form method="post" action="?/logout" use:enhance={onLogout}>
			<Button type="submit" class="flex w-60 gap-2">
				<div class="flex flex-1/6 items-center justify-end">
					<LogOutIcon size={18} />
				</div>
				<div class="flex-5/6 text-start">Sign out</div>
			</Button>
		</form>
		{#if data.userProfile.email && !data.userProfile.emailVerified}
			<form
				method="post"
				action="?/resendVerificationEmail"
				use:enhance={onResendVerificationEmail}
			>
				<Button type="submit" class="flex w-60 gap-2" disabled={loadingVerifyEmail}>
					<div class="flex flex-1/6 items-center justify-end">
						<MailIcon size={18} />
					</div>
					<div class="flex-5/6 text-start">Verify Email</div>
				</Button>
				<p class="text-destructive">
					{form?.sendEmail?.message ?? ""}
				</p>
			</form>
		{/if}
		<Button class="flex w-60 gap-2" href="/account/change-password">
			<div class="flex flex-1/6 items-center justify-end">
				<LockIcon size={18} />
			</div>
			<div class="flex-5/6 text-start">Change Password</div>
		</Button>
		<Button
			type="button"
			variant="destructive"
			class="flex w-60 gap-2"
			aria-haspopup="dialog"
			onclick={() => (deleteDialogOpen = true)}
		>
			<div class="flex flex-1/6 items-center justify-end">
				<TrashIcon size={18} />
			</div>
			<div class="flex-5/6 text-start">Delete Account</div>
		</Button>
		<AlertDialog.Root bind:open={deleteDialogOpen}>
			<AlertDialog.Content>
				<AlertDialog.Header>
					<AlertDialog.Title>Delete account?</AlertDialog.Title>
					<AlertDialog.Description>
						Are you sure you want to delete your account? This action cannot be undone.
					</AlertDialog.Description>
				</AlertDialog.Header>
				<AlertDialog.Footer>
					<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
					<form method="post" action="?/deleteAccount" use:enhance={onDeleteAccount}>
						<AlertDialog.Action type="submit" variant="destructive">
							Delete Account
						</AlertDialog.Action>
					</form>
				</AlertDialog.Footer>
			</AlertDialog.Content>
		</AlertDialog.Root>
	</div>
</main>
