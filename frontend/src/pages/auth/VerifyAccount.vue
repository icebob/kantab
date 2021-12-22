<template>
	<div>
		<h3 class="my-4">Verify Account</h3>
		<form @submit.prevent="submit">
			<div v-if="error" class="alert error mb-2">{{ error }}</div>
			<div v-if="success" class="alert success mb-2">{{ success }}</div>
		</form>
	</div>
</template>

<script>
import AuthMixin from "../../mixins/auth.mixin";

export default {
	mixins: [AuthMixin],

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
