<script>
	import { goto } from "$app/navigation";
</script>

<main class="login-main">
	<div class="login-card">
		<h1 class="login-title">Login / Create Account</h1>
		<p class="login-description">
			This feature is coming soon! For now, you can play without an account.
		</p>

		<div class="login-actions">
			<button class="primary-button" onclick={() => goto("/game")}> Play Without Account </button>
			<button class="secondary-button" onclick={() => goto("/")}> Back to Home </button>
		</div>
	</div>
</main>

<style lang="postcss">
	.login-main {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: linear-gradient(135deg, var(--background-color) 0%, #f2f0e6 100%);
	}

	.login-card {
		background: white;
		padding: 3rem;
		border-radius: 12px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
		text-align: center;
		max-width: 400px;
		width: 100%;
	}

	.login-title {
		color: var(--primary-color);
		margin-bottom: 1rem;
		font-size: 2rem;
		font-weight: bold;
	}

	.login-description {
		color: var(--text-color);
		margin-bottom: 2rem;
		line-height: 1.6;
	}

	.login-actions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.primary-button,
	.secondary-button {
		padding: 1rem 2rem;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.primary-button {
		background: var(--primary-color);
		color: white;
	}

	.primary-button:hover {
		background: var(--primary-color-dark);
		transform: translateY(-2px);
	}

	.secondary-button {
		background: white;
		color: var(--primary-color);
		border: 2px solid var(--primary-color);
	}

	.secondary-button:hover {
		background: var(--primary-color);
		color: white;
	}
</style>
