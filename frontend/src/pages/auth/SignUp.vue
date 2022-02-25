<template>
	<div>
		<h3 class="my-4">Sign Up</h3>
		<form @submit.prevent="submit">
			<div v-if="error" class="alert bg-negative mb-2">{{ error }}</div>
			<div v-if="success" class="alert bg-positive mb-2">{{ success }}</div>
			<div class="form-element no-label">
				<input
					v-model="fullName"
					type="text"
					name="fullName"
					placeholder="Full name"
					required
					class=""
				/>
			</div>
			<div class="form-element no-label mt-2">
				<input
					v-model="email"
					type="email"
					name="email"
					placeholder="E-mail"
					required
					class="pr-8"
				/>

				<i class="icon fa fa-envelope"></i>
			</div>
			<div class="form-element no-label mt-2">
				<input
					v-model="username"
					type="text"
					name="username"
					placeholder="Username"
					required
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
import { mapActions } from "pinia";
import { authStore } from "../../store/authStore";

export default {
	mixins: [AuthMixin],

	methods: {
		...mapActions(authStore, ["register"]),

		async process() {
			const res = await this.register({
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
