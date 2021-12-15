<template>
	<div id="app">
		<div id="nav">
			<router-link to="/">Home</router-link> |
			<router-link to="/style-guide">Style Guide</router-link> |
			<router-link to="/protected">Protected</router-link> |
			<router-link to="/about">{{ $t("About") }}</router-link> |
			<template v-if="!$authenticator.isAuthenticated()">
				<router-link to="/login">Login</router-link> |
				<router-link to="/signup">Sign Up</router-link> |
			</template>
			<template v-else>
				<a style="cursor: pointer" @click="$authenticator.logout()">Logout</a> |
			</template>
		</div>
		<router-view />
	</div>
</template>

<script>
import store from "./store/index";

export default {
	created() {
		store.dispatch("init");
	}
};
</script>

<style lang="scss" scoped>
#nav {
	padding: 30px;
	a {
		font-weight: bold;
		color: #e4eaf1;
		&.router-link-exact-active {
			color: #42b983;
		}
	}
}
</style>
