<script>
	import { enhance } from "$app/forms";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";

	/** @type {import("./$types").ActionData} */
	export let form;
</script>

<main class="mx-auto mt-10 w-full max-w-md p-8 pb-28">
	<h1 class="mb-3 text-3xl font-bold">Enter your new password</h1>
	<form method="post" use:enhance>
		<div class="mb-2 grid gap-2">
			<Label for="password">Password</Label>
			<Input id="password" required type="password" name="password" autocomplete="new-password" />
		</div>
		<Button type="submit">Reset password</Button>
		<p class="text-destructive">{form?.message ?? ""}</p>
	</form>
</main>
