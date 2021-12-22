<template>
	<div>
		<h3 class="my-4">Sign Up</h3>
		<form @submit.prevent="submit">
			<div v-if="error" class="alert error mb-2">{{ error }}</div>
			<div v-if="success" class="alert success mb-2">{{ success }}</div>
			<div class="flex relative items-center">
				<input
					v-model="fullName"
					type="text"
					name="fullName"
					placeholder="Full name"
					required
					class="form-input p-2"
				/>
			</div>
			<div class="flex relative items-center mt-2">
				<input
					v-model="email"
					type="email"
					name="email"
					placeholder="E-mail"
					required
					class="form-input p-2 pr-5"
				/>
				<div class="absolute right-3 text-muted">
					<i class="fa fa-envelope text-lg"></i>
				</div>
			</div>
			<div class="flex relative items-center mt-2">
				<input
					v-model="username"
					type="text"
					name="username"
					placeholder="Username"
					required
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
			<span class="text-xs text-muted">Leave empty for passwordless account</span>
			<div class="mt-4 w-full">
				<button
					type="submit"
					class="button primary w-full"
					:class="{ loading: processing }"
				>
					Sign Up
				</button>
			</div>
			<social-auth class="my-4" />
			<div class="text-sm">
				<span>Already have an account?</span>
				<router-link class="pl-1 text-primary font-bold hover:underline" to="/login"
					>Sign In</router-link
				>
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
			const res = await this.$authenticator.register({
				fullName: this.fullName,
				email: this.email,
				username: this.username,
				password: this.password
			});
			if (!res) this.success = "Account created. Please activate now.";
		}
	}
};
</script>
