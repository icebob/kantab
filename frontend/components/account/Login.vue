<template>
<page-content>
	<page-center>
		<div class="auth-panel">
			<logo />
			<h4>Sign In</h4>
			<form @submit.prevent="submit">
				<div v-if="error" class="alert error">{{ error }}</div>
				<div v-if="success" class="alert success">{{ success }}</div>
				<fieldset class="email">
					<input type="text" name="email" v-model="email" placeholder="E-mail or username" />
					<i class="fa fa-user"></i>
				</fieldset>
				<fieldset class="password">
					<input type="password" name="password" v-model="password" placeholder="Password" />
					<i class="fa fa-key"></i>
					<!-- div class="remember">
						<input type="checkbox" id="remember" v-model="remember" />
						<label for="remember">Remember me</label>
					</div -->
					<div class="forgot">
						<router-link to="/forgot-password">Forgot password?</router-link>
					</div>
				</fieldset>
				<fieldset v-if="need2FAToken" class="token">
					<input type="text" name="token" v-model="token" ref="token" placeholder="Two-factor code" />
					<i class="fa fa-key"></i>
				</fieldset>
				<fieldset>
					<submit-button :loading="processing" size="large" color="primary" caption="Login" />
				</fieldset>
				<social-auth />
				<fieldset class="already">
					<span>Don't have an account?</span>
					<router-link to="/signup">Sign Up</router-link>
				</fieldset>
			</form>
		</div>
	</page-center>
</page-content>
</template>

<script>
import AuthPanel from "./mixins/AuthPanel";

export default {
	mixins: [
		AuthPanel
	],

	data() {
		return {
			need2FAToken: false,
			token: ""
		};
	},

	methods: {
		async process() {
			try {
				const res = await this.$authenticator.login(this.email, this.password, this.need2FAToken ? this.token : null);
				if (res.passwordless) {
					this.success = `Magic link has been sent to '${res.email}'. Use it to sign in.`;
				}
			} catch(err) {
				console.log(err);
				if (err.type == "ERR_MISSING_2FA_CODE") {
					this.need2FAToken = true;
					this.token = "";
					this.success = "Open your authenticator app and enter the verification code";

					this.$nextTick(() => this.$refs.token.focus());

					return;
				}

				throw err;
			}
		}
	}
};
</script>
