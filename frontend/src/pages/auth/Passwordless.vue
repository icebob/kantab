<template>
	<div>
		<h3 class="my-4">Sign In</h3>
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
		...mapActions(authStore, ["passwordless"]),

		async process() {
			this.success = "Verifying token...";

			await this.passwordless({ token: this.$route.query.token });
			this.success = "Logging in...";
			setTimeout(() => this.$router.push({ name: "home" }), 1000);
		}
	}
};
</script>
