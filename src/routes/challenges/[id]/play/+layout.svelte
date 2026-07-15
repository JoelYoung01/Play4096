<script>
	import "$lib/assets/playSurface.css";

	let { children } = $props();
</script>

<div class="play-surface h-full">
	{@render children?.()}
</div>
