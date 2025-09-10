<script>
	import { enhance } from "$app/forms";
	import { page } from "$app/state";
	import Btn from "$lib/components/Btn.svelte";
	import { LogOutIcon, PencilIcon, LockIcon, TrashIcon } from "@lucide/svelte";
</script>

<main class="mx-auto mt-10 w-full max-w-md p-8" style:color={page.data.theme?.primary}>
	<h1 class="text-3xl font-bold">Account</h1>
	<p class="mb-4 text-sm text-gray-500">
		Hello, {page.data.user.displayName || page.data.user.username}!
	</p>
	<div class="flex flex-col gap-2">
		<Btn class="flex w-60 gap-2" href="/account/edit-details">
			<div class="flex flex-1/6 items-center justify-end">
				<PencilIcon size={18} />
			</div>
			<div class="flex-5/6 text-start">Edit Profile</div>
		</Btn>
		<form method="post" action="?/logout" use:enhance>
			<Btn class="flex w-60 gap-2">
				<div class="flex flex-1/6 items-center justify-end">
					<LogOutIcon size={18} />
				</div>
				<div class="flex-5/6 text-start">Sign out</div>
			</Btn>
		</form>
		<Btn class="flex w-60 gap-2" href="/account/change-password">
			<div class="flex flex-1/6 items-center justify-end">
				<LockIcon size={18} />
			</div>
			<div class="flex-5/6 text-start">Change Password</div>
		</Btn>
		<form method="post" action="?/deleteAccount" use:enhance>
			<Btn class="flex w-60 gap-2">
				<div class="flex flex-1/6 items-center justify-end">
					<TrashIcon size={18} />
				</div>
				<div class="flex-5/6 text-start">Delete Account</div>
			</Btn>
		</form>
	</div>
</main>
