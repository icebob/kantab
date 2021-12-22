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
import AuthPanel from "../../mixins/auth.mixin";

export default {
	mixins: [AuthPanel],

	mounted() {
		if (!this.$route.query.token) this.error = "Missing token.";
		else this.submit();
	},

	methods: {
		async process() {
			this.success = "Verifying account...";

			await this.$authenticator.verifyAccount(this.$route.query.token);
			this.success = "Account verified. Logging in...";
			setTimeout(() => this.$router.push({ name: "home" }), 1000);
		}
	}
};
</script>
