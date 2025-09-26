<script>
	import { enhance } from "$app/forms";
	import Btn from "$lib/components/Btn.svelte";

	let { data, form } = $props();

	let loading = $state(false);

	/** @type {import('./$types').SubmitFunction} */
	function onSubmit() {
		loading = true;

		return ({ update }) => {
			loading = false;
			update();
		};
	}
</script>

<main class="mx-auto mt-10 w-full max-w-md p-8">
	<h1 class="mb-3 text-3xl font-bold">Edit Details</h1>
	<form class="mb-4 block" method="post" action="?/editDetails" use:enhance={onSubmit}>
		<label class="mb-2 block">
			Display Name
			<input
				name="displayName"
				disabled={loading}
				value={data.form?.displayName ?? ""}
				class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>

		<label class="mb-2 block">
			Email
			{#if data.user.emailVerified}
				<span class="text-green-500">(Verified)</span>
			{:else}
				<span class="text-red-500">(Unverified)</span>
			{/if}
			<input
				name="email"
				disabled={loading}
				value={data.form?.email ?? ""}
				class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>

		<div class="flex justify-end gap-2">
			<Btn class="px-4 py-2" disabled={loading}>Save{loading ? "ing..." : ""}</Btn>
		</div>
	</form>

	<h2 class="mb-3 text-2xl font-bold">Change Password</h2>
	<form class="mb-4 block" method="post" action="?/updatePassword" use:enhance={onSubmit}>
		<label class="mb-2 block">
			Current Password
			<input
				disabled={loading}
				type="password"
				name="currentPassword"
				autocomplete="current-password"
				class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>
		<label class="mb-2 block">
			New Password
			<input
				disabled={loading}
				type="password"
				name="newPassword"
				autocomplete="new-password"
				class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>

		<p class="text-red-500">{form?.message ?? ""}</p>

		<div class="flex justify-end gap-2">
			<Btn class="px-4 py-2" disabled={loading}>{loading ? "Updating..." : "Update Password"}</Btn>
		</div>
	</form>

	<div class=" flex justify-center gap-2">
		<Btn class="px-4 py-2" href="/account">Done</Btn>
	</div>
</main>
