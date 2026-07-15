<script>
	import { enhance } from "$app/forms";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { SUPPORT_EMAIL } from "$lib/constants";
	import { slide } from "svelte/transition";

	/** @type {import('./$types').PageProps} */
	let { form } = $props();
</script>

<main class="mx-auto mt-10 w-full max-w-md p-8 pb-28">
	<h1 class="text-3xl font-bold">Forgot your password?</h1>
	<div class="mb-1 flex items-center gap-2">
		Contact Support:
		<a
			class="text-primary hover:underline"
			href={`mailto:${SUPPORT_EMAIL}?subject=Forgot Password Assistance`}>{SUPPORT_EMAIL}</a
		>
	</div>
	<form class="mb-2 block" method="post" use:enhance>
		<div class="grid gap-2">
			<Label for="email">Email</Label>
			<Input id="email" type="email" name="email" required value={form?.email ?? ""} />
		</div>
		{#if form?.message}
			<p transition:slide class="text-destructive">{form.message}</p>
		{/if}
		<Button type="submit" class="mt-2">Send</Button>
	</form>
	<Button href="/login">Back to Login</Button>
</main>
