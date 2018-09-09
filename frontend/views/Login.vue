<template>
<page-content>
	<page-center>
		<div class="auth-panel">
			<logo />
			<h4>Sign In</h4>
			<form @submit.prevent="submit">
				<div class="alert error">{{ error }}</div>
				<div class="alert success">{{ success }}</div>
				<fieldset class="email">
					<input type="text" v-model="email" placeholder="E-mail or username" />
					<i class="fa fa-user"></i>
				</fieldset>
				<fieldset class="password">
					<input type="password" v-model="password" placeholder="Password" />
					<i class="fa fa-key"></i>
					<!-- div class="remember">
						<input type="checkbox" id="remember" v-model="remember" />
						<label for="remember">Remember me</label>
					</div -->
					<div class="forgot">
						<router-link to="/forgot-password">Forgot password?</router-link>
					</div>
				</fieldset>
				<fieldset>
					<input type="submit" value="Login" />
				</fieldset>
				<fieldset class="already">
					<span>Don't have an account?</span>
					<router-link to="/signup">Sign Up</router-link>
				</fieldset>
			</form>
			<hr/>
			<social-auth />
		</div>
	</page-center>
</page-content>
</template>

<script>
import Logo from "../components/Logo";
import SocialAuth from "../components/SocialAuth";
import PageCenter from "../components/PageCenter";
import PageContent from "../components/PageContent";

export default {
	components: {
		Logo,
		SocialAuth,
		PageContent,
		PageCenter
	},
	data() {
		return {
			email: "",
			password: "",
			remember: true,
			error: null,
			success: null,
		};
	},

	methods: {
		async submit() {
			this.error = null;
			this.success = null;
			try {
				const res = await this.$authenticator.login(this.email, this.password);
				if (res.passwordless) {
					this.success = `Magic link has been sent to '${res.email}'. Use it to sign in.`;
				}
			} catch(err) {
				//console.log(JSON.stringify(err, null, 2));
				this.error = err.message;
				this.success = null;
			}

		}
	}
};
</script>

<style lang="scss" scoped>
@import "../styles/auth";
</style>
