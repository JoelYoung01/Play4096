<script>
	import { enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import ThemePreview from "$lib/components/ThemePreview.svelte";
	import { saveThemeId } from "$lib/localStorage.svelte";
	import { CrownIcon } from "@lucide/svelte";

	let { data, form } = $props();

	let selectedId = $state(data.themeId);
	let saving = $state(false);
	let errorMessage = $state("");

	$effect(() => {
		selectedId = data.themeId;
	});

	let isPro = $derived(!!data.isPro);

	/** @type {import('./$types').SubmitFunction} */
	function onSelectTheme() {
		saving = true;
		errorMessage = "";

		return async ({ result, update }) => {
			await update({ reset: false });

			if (result.type === "success" && result.data?.theme?.success) {
				const id = result.data.theme.themeId;
				selectedId = id;
				saveThemeId(id);
				await invalidateAll();
			} else if (result.type === "failure") {
				errorMessage = result.data?.theme?.message ?? "Could not save theme";
			}

			saving = false;
		};
	}
</script>

<svelte:head>
	<title>Themes - 4096</title>
	<meta name="description" content="Choose a color theme for 4096." />
</svelte:head>

<main class="mx-auto w-full max-w-lg px-4 pt-10 pb-28 text-foreground">
	<h1 class="mb-1 text-3xl font-bold text-primary">Themes</h1>
	<p class="mb-6 text-sm text-muted-foreground">
		Pick a preset. The board and UI update immediately. Pro unlocks exclusive palettes.
	</p>

	{#if errorMessage || form?.theme?.message}
		<p class="mb-4 text-sm text-red-600">{errorMessage || form?.theme?.message}</p>
	{/if}

	<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
		{#each data.previewThemes as theme (theme.id)}
			{@const locked = theme.pro && !isPro}
			{@const active = selectedId === theme.id}
			{#if locked}
				<a
					href="/stripe"
					class="theme-card flex flex-col gap-2 rounded-lg p-3 text-left transition-opacity hover:opacity-90"
					style:background={theme.background}
					style:color={theme.textLight ?? theme.text}
					style:border={`2px solid ${active ? theme.primary : theme.emptyTile}`}
				>
					<div class="pointer-events-none">
						<ThemePreview {theme} selected={active} />
					</div>
					<div class="flex items-center justify-between gap-1 text-sm font-bold">
						<span>{theme.name}</span>
						<span class="inline-flex items-center gap-0.5 text-xs opacity-80">
							<CrownIcon size={14} />
							Pro
						</span>
					</div>
				</a>
			{:else}
				<form method="post" action="?/setTheme" use:enhance={onSelectTheme} class="contents">
					<input type="hidden" name="themeId" value={theme.id} />
					<button
						type="submit"
						disabled={saving}
						class="theme-card flex flex-col gap-2 rounded-lg p-3 text-left transition-transform hover:scale-[1.02] disabled:opacity-60"
						style:background={theme.background}
						style:color={theme.textLight ?? theme.text}
						style:border={`2px solid ${active ? theme.primary : theme.emptyTile}`}
					>
						<div class="pointer-events-none">
							<ThemePreview {theme} selected={active} />
						</div>
						<div class="flex items-center justify-between gap-1 text-sm font-bold">
							<span>{theme.name}</span>
							{#if active}
								<span class="text-xs opacity-70">Active</span>
							{/if}
						</div>
					</button>
				</form>
			{/if}
		{/each}
	</div>
</main>
