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
import AuthPanel from "./mixins/AuthPanel";

export default {
	mixins: [
		AuthPanel
	],

	methods: {
		async process() {
			this.success = "Verifying token...";

			await this.$authenticator.passwordless(this.$route.query.token);
			this.success = "Logging in...";
			setTimeout(() => this.$router.push({ name: "home" }), 1000);
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
