<script>
	import "../app.css";
	import favicon from "$lib/assets/favicon.png";
	import { page } from "$app/state";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>4096</title>
</svelte:head>

<div class="app-container" style:background-color={page.data.theme?.background}>
	{@render children?.()}
</div>

<style lang="postcss">
	.app-container {
		/* Prevent Chrome's pull-to-refresh and other touch gestures */
		touch-action: none;
		user-select: none;
		overscroll-behavior: contain;
		user-drag: none;
		/* Additional gesture prevention */
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		-webkit-overflow-scrolling: touch;
		-webkit-overscroll-behavior: contain;
		-webkit-tap-highlight-color: transparent;
		-webkit-touch-callout: none;
		-webkit-user-drag: none;
		-khtml-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		-khtml-user-drag: none;
		-moz-user-drag: none;
		-o-user-drag: none;
	}
</style>
