<template>
<page-content>
	<page-center>
		<div class="auth-panel">
			<logo />
			<h4>Sign In</h4>
			<form @submit.prevent="submit">
				<div v-if="error" class="alert error">{{ error }}</div>
				<div v-if="success" class="alert success">{{ success }}</div>
			</form>
		</div>
	</page-center>
</page-content>
</template>

<script>
import Logo from "../components/Logo";
import PageCenter from "../components/PageCenter";
import PageContent from "../components/PageContent";

export default {
	components: {
		Logo,
		PageContent,
		PageCenter
	},
	data() {
		return {
			error: null,
			success: null,
		};
	},

	methods: {
		async submit() {
			this.error = null;
			this.success = "Verifying token...";
			try {
				await this.$authenticator.passwordless(this.$route.query.token);
				this.success = "Logging in...";
				setTimeout(() => this.$router.push({ name: "home" }), 1000);
			} catch(err) {
				this.success = null;
				this.error = err.message;
			}
		}
	},

	mounted() {
		if (!this.$route.query.token)
			this.error = "Missing token.";
		else
			this.submit();
	}
};
</script>

<style lang="scss" scoped>
@import "../styles/auth";
</style>
