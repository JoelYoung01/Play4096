<script>
	let { href = undefined, class: className = undefined, children = undefined, ...props } = $props();

	let classes = $derived(`btn ${className} inline-flex items-center`);
</script>

{#if href}
	<a {href} class={classes} {...props}>
		{@render children?.()}
	</a>
{:else}
	<button class={classes} {...props}>
		{@render children?.()}
	</button>
{/if}

<style lang="postcss">
	.btn {
		--btn-color: var(--primary-color);
		--btn-background: var(--background-color);
		--btn-border-radius: 8px;
		--btn-padding: 12px 24px;
		--btn-font-size: 1rem;
		--btn-font-weight: bold;
		--btn-cursor: pointer;
		--btn-transition: background-color 0.2s;

		/* Automatically calculate a darker color for hover using color-mix if supported, fallback to original */
		--btn-color-dark: color-mix(in srgb, var(--btn-color), black 10%);

		background: var(--btn-color);
		color: var(--btn-background);
		border-radius: var(--btn-border-radius);
		padding: var(--btn-padding);
		font-size: var(--btn-font-size);
		font-weight: var(--btn-font-weight);
		cursor: var(--btn-cursor);
		transition: var(--btn-transition);

		&:hover:not(:disabled) {
			background: var(--btn-color-dark, var(--btn-color));
		}

		&:disabled {
			cursor: default;
		}
	}
</style>
