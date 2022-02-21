<template>
	<div>
		<h3 class="my-4">Verify Account</h3>
		<form @submit.prevent="submit">
			<div v-if="error" class="alert bg-negative mb-2">{{ error }}</div>
			<div v-if="success" class="alert bg-positive mb-2">{{ success }}</div>
		</form>
	</div>
</template>

<script>
import AuthMixin from "../../mixins/auth.mixin";
import { mapActions } from "pinia";
import { authStore } from "../../store/authStore";

export default {
	mixins: [AuthMixin],

	mounted() {
		if (!this.$route.query.token) this.error = "Missing token.";
		else this.submit();
	},

	methods: {
		...mapActions(authStore, ["verifyAccount"]),

		async process() {
			this.success = "Verifying account...";
			await this.verifyAccount({ token: this.$route.query.token });
			this.success = "Account verified. Logging in...";
			setTimeout(() => this.$router.push({ name: "home" }), 1000);
		}
	}
};
</script>
