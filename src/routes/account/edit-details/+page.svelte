<script>
	import { enhance } from "$app/forms";
	import Btn from "$lib/components/Btn.svelte";

	let { data } = $props();

	let loading = $state(false);

	function onSubmit() {
		loading = true;

		/** @param {{ update: () => void }} param0 */
		return ({ update }) => {
			loading = false;
			update();
		};
	}
</script>

<main class="mx-auto mt-10 w-full max-w-md p-8">
	<form method="post" action="?/editDetails" use:enhance={onSubmit}>
		<label class="mb-2 block">
			Display Name
			<input
				name="displayName"
				disabled={loading}
				value={data.form?.displayName ?? ""}
				class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>

		<div class="flex justify-end gap-2">
			<Btn class="px-4 py-2" disabled={loading}>Save{loading ? "ing..." : ""}</Btn>
		</div>
	</form>
</main>
