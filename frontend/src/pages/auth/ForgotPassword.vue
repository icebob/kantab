<template>
	<div>
		<h3 class="my-4">Forgot Password</h3>
		<form @submit.prevent="submit">
			<div v-if="error" class="k-alert error mb-2">{{ error }}</div>
			<div v-if="success" class="k-alert success mb-2">{{ success }}</div>
			<div class="flex relative items-center">
				<input
					v-model="email"
					type="text"
					name="email"
					placeholder="E-mail or username"
					class="k-input p-2 pr-5"
				/>
				<div class="absolute right-3 text-muted">
					<i class="fa fa-user text-lg"></i>
				</div>
			</div>
			<div class="mt-4 w-full">
				<button
					type="submit"
					class="k-button primary w-full"
					:class="{ loading: processing }"
				>
					Send reset e-mail
				</button>
			</div>
		</form>
	</div>
</template>

<script>
import AuthMixin from "../../mixins/auth.mixin";

export default {
	mixins: [AuthMixin],

	methods: {
		async process() {
			await this.$authenticator.forgotPassword(this.email);
			this.success = "E-mail sent.";
			this.email = "";
		}
	}
};
</script>
