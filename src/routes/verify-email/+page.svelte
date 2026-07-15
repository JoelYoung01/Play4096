<script>
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import { Alert, AlertDescription } from "$lib/components/ui/alert/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";

	let { data, form } = $props();

	let verifyingEmail = $state(false);
	let resendingEmail = $state(false);
	let showSuccess = $state(false);

	let disableVerify = $derived(data.expired || data.alreadyVerified || verifyingEmail);

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

<main class="mx-auto mt-10 w-full max-w-md p-8 pb-28">
	{#if showSuccess}
		<Alert class="mb-4">
			<AlertDescription>Email verified successfully</AlertDescription>
		</Alert>
	{/if}

	<h1 class="mb-3 text-3xl font-bold">Verify your email address</h1>
	{#if data.alreadyVerified && !verifyingEmail}
		<p class="mb-4">Your email address has already been verified.</p>
	{:else if data.expired}
		<p class="mb-4">The verification code has expired. Please request a new code.</p>
	{:else}
		<p class="mb-4">We sent an 8-digit code to {data.email}.</p>
	{/if}
	<form class="mb-1 block" method="post" use:enhance={onVerifyEmail} action="?/verify">
		<div class="mb-2 grid gap-2">
			<Label for="code">Code</Label>
			<Input id="code" type="text" disabled={data.expired} required name="code" />
		</div>
		<Button type="submit" disabled={disableVerify}>
			{verifyingEmail ? "Verifying..." : "Verify"}
		</Button>
		<p class="text-destructive">{form?.verify?.message ?? ""}</p>
	</form>
	<form class="mb-4 block" method="post" use:enhance={onResendEmail} action="?/resend">
		<Button type="submit" disabled={resendingEmail || data.alreadyVerified}>Resend code</Button>
		<p class={form?.resend?.type === "info" ? "text-muted-foreground" : "text-destructive"}>
			{form?.resend?.message ?? ""}
		</p>
	</form>
	<Button href="/account/edit-details">Change your email</Button>
</main>
