<template>
	<div>
		<h3 class="my-4">Sign In</h3>
		<form @submit.prevent="submit">
			<div v-if="error" class="alert bg-negative mb-2">{{ error }}</div>
			<div v-if="success" class="alert bg-positive mb-2">{{ success }}</div>
			<div class="form-element no-label">
				<input
					v-model="email"
					type="text"
					name="email"
					placeholder="E-mail or username"
					class="pr-8"
				/>
				<i class="icon fa fa-user"></i>
			</div>
			<div class="form-element no-label mt-2">
				<input
					v-model="password"
					type="password"
					name="password"
					placeholder="Password"
					class="pr-8"
				/>
				<i class="icon fa fa-key"></i>
			</div>
			<div class="text-right text-xs mt-1 text-gray-400">
				<router-link class="hover:underline" to="/forgot-password"
					>Forgot password?</router-link
				>
			</div>

			<div v-if="need2FAToken" class="form-element no-label mt-2">
				<input
					ref="token"
					v-model="token"
					type="text"
					name="token"
					placeholder="Two-factor code"
					class="pr-8"
				/>
				<i class="icon fa fa-lock"></i>
			</div>
			<div class="mt-4 w-full">
				<button
					type="submit"
					class="button primary w-full"
					:class="{ loading: processing }"
				>
					Login
				</button>
			</div>
			<social-auth class="my-4" />
			<div class="text-sm">
				<span>Don't have an account?</span>
				<router-link class="pl-1 text-primary font-bold hover:underline" to="/signup"
					>Sign Up</router-link
				>
			</div>
		</form>
	</div>
</template>

<script>
import AuthMixin from "../../mixins/auth.mixin";
//import { mapActions } from "vuex";
import { mapActions } from "pinia";
import { authStore } from "../../store/authStore";

export default {
	mixins: [AuthMixin],

	data() {
		return {
			need2FAToken: false,
			token: ""
		};
	},

	methods: {
		...mapActions(authStore, ["login"]),

		async process() {
			try {
				const res = await this.login({
					email: this.email,
					password: this.password,
					token: this.need2FAToken ? this.token : null
				});
				if (res.passwordless) {
					this.success = `Magic link has been sent to '${res.email}'. Use it to sign in.`;
				}
			} catch (err) {
				console.log(err);
				if (
					err?.response?.errors?.[0]?.extensions?.exception?.type ==
					"ERR_MISSING_2FA_CODE"
				) {
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
