<script>
	import { page } from "$app/state";
	import { enhance } from "$app/forms";
	import Btn from "$lib/components/Btn.svelte";

	let { form } = $props();
</script>

<main class="mx-auto mt-10 w-full max-w-md p-8" style:color={page.data.theme?.primary}>
	<h1 class="mb-3 text-3xl font-bold">Login / Create Account</h1>
	<form method="post" action="?/login" use:enhance>
		<label class="mb-2 block">
			Username
			<input
				name="username"
				autocomplete="username"
				class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>

		<label class="block">
			Password
			<input
				type="password"
				name="password"
				autocomplete="current-password"
				class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>
		<div class="mb-4">
			<a href="/forgot-password">Forgot password?</a>
		</div>

		<input type="hidden" name="redirectTo" value={page.data.redirectTo ?? ""} />

		<Btn class="px-4 py-2">Login</Btn>
		<Btn class="px-4 py-2" formaction="?/register">Register</Btn>
	</form>
	<p style="color: red">{form?.message ?? ""}</p>
</main>
