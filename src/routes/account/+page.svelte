<script>
	import { enhance } from "$app/forms";
	import { page } from "$app/state";
	import Btn from "$lib/components/Btn.svelte";
	import { clearBestScore, clearGame } from "$lib/localStorage.svelte";
	import { LogOutIcon, PencilIcon, TrashIcon, CrownIcon, MailIcon, LockIcon } from "@lucide/svelte";
	import { USER_LEVELS } from "$lib/constants";
	import ProBadge from "$lib/components/ProBadge.svelte";
	import { gameState } from "../game/state.svelte";
	import { goto } from "$app/navigation";

	let { data, form } = $props();

	let loadingVerifyEmail = $state(false);
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
	function onDeleteAccount({ cancel }) {
		let confirmed = confirm(
			"Are you sure you want to delete your account? This action cannot be undone."
		);

		if (!confirmed) {
			return cancel();
		}

		// Reset game state
		clearUserData();

		return async ({ update }) => {
			await update();
		};
	}
</script>

<main class="mx-auto mt-10 w-full max-w-md p-8" style:color={page.data.theme?.primary}>
	<h1 class="flex items-center gap-2 text-3xl font-bold">
		Account
		{#if data.userProfile.level === USER_LEVELS.PRO}
			<ProBadge />
		{/if}
	</h1>
	<p class="mb-4 text-sm text-gray-500">
		Hello, {data.userProfile.displayName || data.userProfile.username}!
	</p>

	<dl class="mb-4 text-gray-500">
		<dt class="font-bold text-gray-700">Display Name</dt>
		<dd class="mb-2">{data.userProfile.displayName || data.userProfile.username}</dd>
		<dt class="font-bold text-gray-700">Email</dt>
		<dd class="mb-2">
			{data.userProfile.email}
			{#if data.userProfile.emailVerified}
				<span class="text-green-500">(Verified)</span>
			{:else}
				<span class="text-red-500">(Unverified)</span>
			{/if}
		</dd>
	</dl>

	{#if warnProNoEmail}
		<p class="mb-4 text-sm text-red-800">
			It is recommended to add an email address and verify it as a Pro User, as it will make it
			easier to recover your account if you forget your password.
		</p>
	{/if}

	<div class="flex flex-col gap-2">
		<Btn class="flex w-60 gap-2" href="/account/edit-details">
			<div class="flex flex-1/6 items-center justify-end">
				<PencilIcon size={18} />
			</div>
			<div class="flex-5/6 text-start">Edit Profile</div>
		</Btn>
		{#if data.userProfile.level !== USER_LEVELS.PRO}
			<a
				class="flex w-60 gap-2 rounded-md bg-[var(--color-secondary)] px-4 py-3 font-bold text-gray-800 transition-colors hover:bg-[var(--color-secondary-dark)]"
				href="/stripe"
			>
				<div class="flex flex-1/6 items-center justify-end">
					<CrownIcon size={18} />
				</div>
				<div class="flex-5/6 text-start">Upgrade to Pro</div>
			</a>
		{/if}
		<form method="post" action="?/logout" use:enhance={onLogout}>
			<Btn class="flex w-60 gap-2">
				<div class="flex flex-1/6 items-center justify-end">
					<LogOutIcon size={18} />
				</div>
				<div class="flex-5/6 text-start">Sign out</div>
			</Btn>
		</form>
		{#if data.userProfile.email && !data.userProfile.emailVerified}
			<form
				method="post"
				action="?/resendVerificationEmail"
				use:enhance={onResendVerificationEmail}
			>
				<Btn class="flex w-60 gap-2" disabled={loadingVerifyEmail}>
					<div class="flex flex-1/6 items-center justify-end">
						<MailIcon size={18} />
					</div>
					<div class="flex-5/6 text-start">Verify Email</div>
				</Btn>
				<p class="text-red-500">
					{form?.sendEmail?.message ?? ""}
				</p>
			</form>
		{/if}
		<Btn class="flex w-60 gap-2" href="/account/change-password">
			<div class="flex flex-1/6 items-center justify-end">
				<LockIcon size={18} />
			</div>
			<div class="flex-5/6 text-start">Change Password</div>
		</Btn>
		<form method="post" action="?/deleteAccount" use:enhance={onDeleteAccount}>
			<button
				class="flex w-60 gap-2 rounded-md bg-transparent px-4 py-3 font-bold text-red-500 outline-2 -outline-offset-2 outline-red-500 transition-colors hover:bg-red-500 hover:text-white"
			>
				<div class="flex flex-1/6 items-center justify-end">
					<TrashIcon size={18} />
				</div>
				<div class="flex-5/6 text-start">Delete Account</div>
			</button>
		</form>
	</div>
</main>
