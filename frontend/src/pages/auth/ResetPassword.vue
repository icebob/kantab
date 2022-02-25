<template>
	<div>
		<h3 class="my-4">Reset Password</h3>
		<form @submit.prevent="submit">
			<div v-if="error" class="alert bg-negative mb-2">{{ error }}</div>
			<div v-if="success" class="alert bg-positive mb-2">{{ success }}</div>
			<template v-if="$route.query.token">
				<div class="form-element no-label mt-2">
					<input
						v-model="password"
						type="password"
						name="password"
						placeholder="New password"
						class="pr-8"
					/>
					<i class="icon fa fa-key"></i>
				</div>
				<div class="mt-4 w-full">
					<button
						type="submit"
						class="button primary w-full"
						:class="{ loading: processing }"
					>
						Reset Password
					</button>
				</div>
			</template>
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
	},

	methods: {
		...mapActions(authStore, ["resetPassword"]),

		async process() {
			await this.resetPassword({ token: this.$route.query.token, password: this.password });
			this.success = "Password changed. Logging in...";
			setTimeout(() => this.$router.push({ name: "home" }), 1000);
		}
	}
};
</script>
