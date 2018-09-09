<template>
<page-content>
	<page-center>
		<div class="auth-panel">
			<logo />
			<h4>Verify Account</h4>
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
			this.success = "Verifying account...";
			try {
				await this.$authenticator.verifyAccount(this.$route.query.token);
				this.success = "Account verified. Logging in...";
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
