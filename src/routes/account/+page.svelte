<script>
	import { enhance } from "$app/forms";
	import { page } from "$app/state";
</script>

<main class="mx-auto mt-10 p-8" style:color={page.data.theme?.primary}>
	<h1 class="text-3xl font-bold">Account</h1>
	<p class="text-sm text-gray-500">
		Welcome back, {page.data.user.username}!
	</p>
	<form method="post" action="?/logout" use:enhance>
		<button>Sign out</button>
	</form>
</main>
