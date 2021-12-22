<template>
	<div>
		<h3 class="my-4">Sign In</h3>
		<form @submit.prevent="submit">
			<div v-if="error" class="alert error mb-2">{{ error }}</div>
			<div v-if="success" class="alert success mb-2">{{ success }}</div>
			<div class="flex relative items-center">
				<input
					v-model="email"
					type="text"
					name="email"
					placeholder="E-mail or username"
					class="form-input p-2 pr-5"
				/>
				<div class="absolute right-3 text-muted">
					<i class="fa fa-user text-lg"></i>
				</div>
			</div>
			<div class="flex relative items-center mt-2">
				<input
					v-model="password"
					type="password"
					name="password"
					placeholder="Password"
					class="form-input p-2 pr-5"
				/>
				<div class="absolute right-3 text-muted">
					<i class="fa fa-key text-lg"></i>
				</div>
			</div>
			<div class="text-right text-xs mt-1 text-gray-400">
				<router-link class="hover:underline" to="/forgot-password"
					>Forgot password?</router-link
				>
			</div>

			<div v-if="need2FAToken" class="flex relative items-center mt-2">
				<input
					ref="token"
					v-model="token"
					type="text"
					name="token"
					placeholder="Two-factor code"
					class="form-input p-2 pr-5"
				/>
				<div class="absolute right-3 text-muted">
					<i class="fa fa-lock"></i>
				</div>
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

export default {
	mixins: [AuthMixin],

	data() {
		return {
			need2FAToken: false,
			token: ""
		};
	},

	methods: {
		async process() {
			try {
				const res = await this.$authenticator.login(
					this.email,
					this.password,
					this.need2FAToken ? this.token : null
				);
				if (res.passwordless) {
					this.success = `Magic link has been sent to '${res.email}'. Use it to sign in.`;
				}
			} catch (err) {
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
