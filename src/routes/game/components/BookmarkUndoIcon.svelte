<script>
	import { Icon } from "@lucide/svelte";

	/** @type {import("@lucide/svelte").IconProps} */
	let props = $props();

	// Bookmark outline (same as Lucide bookmark-plus) with a compact undo-2 arrow
	// in place of the plus — tip left, stem curving down-right like Undo2.
	const iconNode = [
		["path", { d: "M13 13.5 9.5 10l3.5-3.5" }],
		["path", { d: "M9.5 10h4.5a2.5 2.5 0 0 1 2.5 2.5" }],
		[
			"path",
			{
				d: "M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z",
			},
		],
	];
</script>

<Icon name="bookmark-undo" {...props} {iconNode} />
