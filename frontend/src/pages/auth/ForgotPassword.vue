<template>
	<div>
		<h3 class="my-4">Forgot Password</h3>
		<form @submit.prevent="submit">
			<div v-if="error" class="alert bg-negative mb-2">{{ error }}</div>
			<div v-if="success" class="alert bg-positive mb-2">{{ success }}</div>
			<div class="form-element no-label">
				<input
					v-model="email"
					type="email"
					name="email"
					placeholder="E-mail"
					class="pr-5"
				/>
				<i class="icon fa fa-envelope"></i>
			</div>
			<div class="mt-4 w-full">
				<button
					type="submit"
					class="button primary w-full"
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
