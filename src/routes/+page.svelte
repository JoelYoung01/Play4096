<script>
	let score = $state(0);
	let bestScore = $state(0);
</script>

<div class="container mx-auto">
	<div class="flex">
		<div class="flex-1/3">Logo Here</div>
		<div class="flex flex-2/3">
			<div class="flex-1/2">
				<div class="text-center">SCORE</div>
				<div class="text-center">{score}</div>
			</div>
			<div class="flex-1/2">
				<div class="text-center">BEST</div>
				<div class="text-center">{bestScore}</div>
			</div>
		</div>
	</div>
</div>

<style>
	.container {
		max-width: 50rem;
	}
</style>
