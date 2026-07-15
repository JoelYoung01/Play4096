<script>
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { LoaderCircleIcon } from "@lucide/svelte";

	/** @type {import("./$types").PageProps} */
	let { data, form } = $props();

	let loading = $state(false);

	/** @type {import("./$types").SubmitFunction} */
	function onSubmit() {
		loading = true;

		return async ({ result, update }) => {
			if (result.type === "redirect") {
				goto(result.location);
			} else {
				await update();
				loading = false;
			}
		};
	}
</script>

<main class="mx-auto mt-10 w-full max-w-md p-8 pb-28">
	<h1 class="text-3xl font-bold">Verify Email</h1>
	<p class="mb-2 text-sm text-muted-foreground">We've sent a 8-digit code to {data.email}.</p>
	<form method="post" use:enhance={onSubmit}>
		<div class="mb-2 grid gap-2">
			<Label for="code">Code</Label>
			<Input id="code" type="text" required name="code" autocomplete="one-time-code" />
		</div>
		<Button type="submit" disabled={loading}>
			{#if loading}
				<div class="flex items-center justify-center gap-2">
					<LoaderCircleIcon class="animate-spin" size={16} />
					Verifying...
				</div>
			{:else}
				Verify
			{/if}
		</Button>
		<p class="text-destructive">{form?.message ?? ""}</p>
	</form>
</main>
