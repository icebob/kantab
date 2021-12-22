<template>
	<div>
		<h3 class="my-4">Reset Password</h3>
		<form @submit.prevent="submit">
			<div v-if="error" class="alert error mb-2">{{ error }}</div>
			<div v-if="success" class="alert success mb-2">{{ success }}</div>
			<template v-if="$route.query.token">
				<div class="flex relative items-center mt-2">
					<input
						v-model="password"
						type="password"
						name="password"
						placeholder="New password"
						class="form-input p-2 pr-5"
					/>
					<div class="absolute right-3 text-muted">
						<i class="fa fa-key text-lg"></i>
					</div>
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

export default {
	mixins: [AuthMixin],

	mounted() {
		if (!this.$route.query.token) this.error = "Missing token.";
	},

	methods: {
		async process() {
			await this.$authenticator.resetPassword(this.$route.query.token, this.password);
			this.success = "Password changed. Logging in...";
			setTimeout(() => this.$router.push({ name: "home" }), 1000);
		}
	}
};
</script>
