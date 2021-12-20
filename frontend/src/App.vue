<template>
	<div id="app">
		<header class="flex align-center p-5">
			<Logo class="mr-2" />
			<div class="flex-auto"></div>
			<div>
				<router-link class="mx-4 hover:underline" to="/">Home</router-link>
				<router-link class="mx-4 hover:underline" to="/style-guide"
					>Style Guide</router-link
				>
				<router-link class="mx-4 hover:underline" to="/protected">Protected</router-link>
				<router-link class="mx-4 hover:underline" to="/about">{{
					$t("About")
				}}</router-link>
				<template v-if="!$authenticator.isAuthenticated()">
					<router-link class="link-login mx-4 hover:underline" to="/login"
						>Login</router-link
					>
					<router-link class="link-signup mx-4 hover:underline" to="/signup"
						>Sign Up</router-link
					>
				</template>
				<template v-else>
					<a
						class="link-logout mx-4 hover:underline"
						style="cursor: pointer"
						@click="$authenticator.logout()"
						>Logout</a
					>
				</template>
			</div>
		</header>
		<router-view />
	</div>
</template>

<script>
import Logo from "./components/account/partials/Logo.vue";
import store from "./store/index";

export default {
	components: {
		Logo
	},

	created() {
		store.dispatch("init");
	}
};
</script>

<style lang="scss" scoped>
a {
	//font-weight: bold;
	color: #e4eaf1;
	&.router-link-exact-active {
		color: #42b983;
	}
}
</style>
