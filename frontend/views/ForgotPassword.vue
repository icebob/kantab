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
					<input type="email" v-model="email" placeholder="E-mail" required />
					<i class="fa fa-envelope"></i>
				</fieldset>
				<fieldset>
					<input type="submit" value="Send reset e-mail" />
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
import Logo from "../components/Logo";
import PageCenter from "../components/PageCenter";
import PageContent from "../components/PageContent";

export default {
	components: {
		Logo,
		PageContent,
		PageCenter
	},
	data() {
		return {
			email: "",
			error: null,
			success: null,
		};
	},

	methods: {
		async submit() {
			this.error = null;
			this.success = null;
			try {
				await this.$authenticator.forgotPassword(this.email);
				this.success = "E-mail sent.";
				this.email = "";
			} catch(err) {
				this.error = err.message;
			}
		}
	}
};
</script>

<style lang="scss" scoped>
@import "../styles/auth";
</style>
