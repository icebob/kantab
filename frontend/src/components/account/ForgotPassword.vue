<template>
	<page-content>
		<page-center>
			<div class="auth-panel">
				<logo />
				<h4>Forgot Password</h4>
				<form @submit.prevent="submit">
					<div v-if="error" class="alert error">{{ error }}</div>
					<div v-if="success" class="alert success">{{ success }}</div>
					<fieldset class="email">
						<input
							type="email"
							name="email"
							v-model="email"
							placeholder="E-mail"
							required
						/>
						<i class="fa fa-envelope"></i>
					</fieldset>
					<fieldset>
						<submit-button
							:loading="processing"
							size="large"
							color="primary"
							caption="Send reset e-mail"
						/>
					</fieldset>
					<fieldset class="already">
						<span>Already have an account?</span>
						<router-link to="/login">Sign In</router-link>
					</fieldset>
				</form>
			</div>
		</page-center>
	</page-content>
</template>

<script>
import AuthPanel from "./mixins/AuthPanel";

export default {
	mixins: [AuthPanel],

	methods: {
		async process() {
			await this.$authenticator.forgotPassword(this.email);
			this.success = "E-mail sent.";
			this.email = "";
		}
	}
};
</script>
