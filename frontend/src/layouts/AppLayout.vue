<template>
	<div class="absolute w-full h-full left-0 top-0 right-0 bottom-0 flex flex-col">
		<header class="flex align-center p-5">
			<Logo class="mr-2" />
			<div class="flex-auto"></div>
			<div class="font-title text-xl">
				<router-link class="mx-4 hover:underline" to="/">Home</router-link>
				<router-link class="mx-4 hover:underline" to="/style-guide"
					>Style Guide</router-link
				>
				<router-link class="mx-4 hover:underline" to="/about">{{
					$t("About")
				}}</router-link>
				<template v-if="!user">
					<router-link id="link-login" class="mx-4 hover:underline" to="/login"
						>Login</router-link
					>
					<router-link id="link-signup" class="mx-4 hover:underline" to="/signup"
						>Sign Up</router-link
					>
				</template>
				<template v-else>
					<a
						id="link-logout"
						class="mx-4 hover:underline"
						style="cursor: pointer"
						@click="logout"
						>Logout</a
					>
				</template>
			</div>
		</header>
		<router-view />
	</div>
</template>

<script>
import Logo from "../components/Logo.vue";
import { mapState, mapActions } from "pinia";
import { authStore } from "../store/authStore";

export default {
	components: {
		Logo
	},

	computed: {
		...mapState(authStore, ["user"])
	},

	methods: {
		...mapActions(authStore, ["logout"])
	}
};
</script>

<style lang="scss" scoped>
a {
	//font-weight: bold;
	color: #e4eaf1;
	&.router-link-exact-active {
		color: #90b227;
	}
}
</style>
