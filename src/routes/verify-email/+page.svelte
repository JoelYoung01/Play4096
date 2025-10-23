<script>
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import Alert from "$lib/components/Alert.svelte";
	import Btn from "$lib/components/Btn.svelte";

	let { data, form } = $props();

	let verifyingEmail = $state(false);
	let resendingEmail = $state(false);
	let showSuccess = $state(false);

	const SUCCESS_DURATION = 2000;

	/** @type {import('./$types').SubmitFunction} */
	function onVerifyEmail() {
		verifyingEmail = true;

		return async ({ update }) => {
			await update();

			if (form?.verify?.success) {
				showSuccess = true;
				await new Promise((resolve) => setTimeout(resolve, SUCCESS_DURATION));
				goto("/account");
			} else {
				verifyingEmail = false;
			}
		};
	}

	/** @type {import('./$types').SubmitFunction} */
	function onResendEmail() {
		resendingEmail = true;

		return async ({ update }) => {
			await update();
			resendingEmail = false;
		};
	}
</script>

<main class="mx-auto mt-10 w-full max-w-md p-8">
	<Alert type="success" duration={SUCCESS_DURATION} bind:show={showSuccess}>
		<div>Email verified successfully</div>
	</Alert>

	<h1 class="mb-3 text-3xl font-bold">Verify your email address</h1>
	{#if data.expired}
		<p class="mb-4">The verification code has expired. Please request a new code.</p>
	{:else}
		<p class="mb-4">We sent an 8-digit code to {data.email}.</p>
	{/if}
	<form class="mb-1 block" method="post" use:enhance={onVerifyEmail} action="?/verify">
		<label class="mb-2 block">
			Code
			<input
				disabled={data.expired}
				required
				name="code"
				class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>
		<Btn class="px-4 py-2" disabled={data.expired || verifyingEmail}
			>{verifyingEmail ? "Verifying..." : "Verify"}</Btn
		>
		<p class="text-red-500">{form?.verify?.message ?? ""}</p>
	</form>
	<form class="mb-4 block" method="post" use:enhance={onResendEmail} action="?/resend">
		<Btn class="px-4 py-2" disabled={resendingEmail}>Resend code</Btn>
		<p class="text-{form?.resend?.type === 'info' ? 'gray' : 'red'}-500">
			{form?.resend?.message ?? ""}
		</p>
	</form>
	<Btn class="px-4 py-2" href="/account/edit-details">Change your email</Btn>
</main>
