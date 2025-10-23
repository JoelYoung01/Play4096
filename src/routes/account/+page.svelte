<script>
	import { enhance } from "$app/forms";
	import { page } from "$app/state";
	import Btn from "$lib/components/Btn.svelte";
	import { clearBestScore, clearGame } from "$lib/localStorage.svelte";
	import { LogOutIcon, PencilIcon, TrashIcon, CrownIcon, MailIcon, LockIcon } from "@lucide/svelte";
	import { USER_LEVELS } from "$lib/constants";
	import ProBadge from "$lib/components/ProBadge.svelte";
	import { gameState } from "../game/state.svelte";

	function clearUserData() {
		clearGame();
		clearBestScore();

		gameState.bestScore = 0;
		gameState.currentGame = null;
	}

	/** @type {import('./$types').SubmitFunction} */
	function onLogout() {
		return ({ update }) => {
			// Reset game state
			clearUserData();

			update();
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

		return ({ update }) => {
			update();
		};
	}
</script>

<main class="mx-auto mt-10 w-full max-w-md p-8" style:color={page.data.theme?.primary}>
	<h1 class="flex items-center gap-2 text-3xl font-bold">
		Account
		{#if page.data.user.level === USER_LEVELS.PRO}
			<ProBadge />
		{/if}
	</h1>
	<p class="mb-4 text-sm text-gray-500">
		Hello, {page.data.user.displayName || page.data.user.username}!
	</p>

	<dl class="mb-4 text-gray-500">
		<dt class="font-bold text-gray-700">Display Name</dt>
		<dd class="mb-2">{page.data.user.displayName || page.data.user.username}</dd>
		<dt class="font-bold text-gray-700">Email</dt>
		<dd class="mb-2">
			{page.data.user.email}
			{#if page.data.user.emailVerified}
				<span class="text-green-500">(Verified)</span>
			{:else}
				<span class="text-red-500">(Unverified)</span>
			{/if}
		</dd>
	</dl>
	<div class="flex flex-col gap-2">
		<Btn class="flex w-60 gap-2" href="/account/edit-details">
			<div class="flex flex-1/6 items-center justify-end">
				<PencilIcon size={18} />
			</div>
			<div class="flex-5/6 text-start">Edit Profile</div>
		</Btn>
		{#if page.data.user.level !== USER_LEVELS.PRO}
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
		{#if page.data.user.email && !page.data.user.emailVerified}
			<Btn class="flex w-60 gap-2" href="/verify-email">
				<div class="flex flex-1/6 items-center justify-end">
					<MailIcon size={18} />
				</div>
				<div class="flex-5/6 text-start">Verify Email</div>
			</Btn>
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
