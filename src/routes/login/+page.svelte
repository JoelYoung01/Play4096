<script>
	import { page } from "$app/state";
	import { enhance } from "$app/forms";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";

	let { form } = $props();
</script>

<main class="mx-auto mt-10 w-full max-w-md p-8 pb-28 text-foreground">
	<h1 class="mb-3 text-3xl font-bold">Login / Create Account</h1>
	<form method="post" action="?/login" use:enhance>
		<div class="mb-2 grid gap-2">
			<Label for="username">Username</Label>
			<Input id="username" type="text" name="username" autocomplete="username" />
		</div>

		<div class="grid gap-2">
			<Label for="password">Password</Label>
			<Input id="password" type="password" name="password" autocomplete="current-password" />
		</div>
		<div class="mb-4">
			<a class="text-primary hover:underline" href="/forgot-password">Forgot password?</a>
		</div>

		<input type="hidden" name="redirectTo" value={page.data.redirectTo ?? ""} />

		<Button type="submit">Login</Button>
		<Button type="submit" formaction="?/register">Register</Button>
	</form>
	<p class="text-destructive">{form?.message ?? ""}</p>
</main>
