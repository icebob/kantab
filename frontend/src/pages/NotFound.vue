<template>
	<div class="absolute w-full h-full left-0 top-0 right-0 bottom-0">
		<div class="h-full flex justify-center items-center">
			<div class="w-96 text-center text-shadow">
				<logo class="justify-center mb-4" />

				<h2 class="text-primary">404 - Page Not Found</h2>

				<h5 class="my-4">
					We looked practically everywhere but can't seem to find the page your're looking
					for.
				</h5>
				<button class="button large primary" @click="$router.push('/')">
					Take Me Away
				</button>
			</div>
		</div>
	</div>
</template>

<script>
import Logo from "../components/Logo.vue";

export default {
	components: {
		Logo
	}
};
</script>
