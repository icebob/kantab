<template>
<page-content>
	<page-center>
		<div class="auth-panel">
			<logo />
			<h4>Sign Up</h4>
			<form @submit.prevent="submit">
				<div class="alert success">{{ success }}</div>
				<div class="alert error">{{ error }}</div>
				<fieldset class="two-fields">
					<input type="text" v-model="firstName" placeholder="First name" required />
					<input type="text" v-model="lastName" placeholder="Last name" required />
				</fieldset>
				<fieldset>
					<input type="email" v-model="email" placeholder="E-mail" required />
					<i class="fa fa-envelope"></i>
				</fieldset>
				<fieldset>
					<input type="text" v-model="username" placeholder="Username" required />
					<i class="fa fa-user"></i>
				</fieldset>
				<fieldset>
					<input type="password" v-model="password" placeholder="Password" />
					<i class="fa fa-key"></i>
					<span class="hint">Leave empty for passwordless account</span>
				</fieldset>
				<fieldset>
					<submit-button :loading="processing" size="large" color="primary" caption="Sign Up" />
				</fieldset>
				<hr/>
				<social-auth />
				<hr/>
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
	mixins: [
		AuthPanel
	],

	methods: {
		async process() {
			const res = await this.$authenticator.register({
				firstName: this.firstName,
				lastName: this.lastName,
				email: this.email,
				username: this.username,
				password: this.password
			});
			if (!res)
				this.success = "Account created. Please activate now.";
		}
	}
};
</script>
