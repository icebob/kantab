<template>
<page-content>
	<page-center>
		<div class="auth-panel">
			<logo />
			<h4>Reset Password</h4>
			<form @submit.prevent="submit">
				<div v-if="error" class="alert error">{{ error }}</div>
				<div v-if="success" class="alert success">{{ success }}</div>
				<fieldset class="password">
					<input type="password" name="password" v-model="password" placeholder="New Password" />
					<i class="fa fa-lock"></i>
				</fieldset>
				<fieldset>
					<submit-button :loading="processing" size="large" color="primary" caption="Reset Password" />
				</fieldset>
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
			await this.$authenticator.resetPassword(this.$route.query.token, this.password);
			this.success = "Password changed. Logging in...";
			setTimeout(() => this.$router.push({ name: "home" }), 1000);
		}
	},

	mounted() {
		if (!this.$route.query.token)
			this.error = "Missing token.";
	}
};
</script>
