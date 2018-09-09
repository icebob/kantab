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
					<input type="submit" value="Sign Up" />
				</fieldset>
				<fieldset class="already">
					<span>Already have an account?</span>
					<router-link to="/login">Sign In</router-link>
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
			firstName: "",
			lastName: "",
			email: "",
			username: "",
			password: "",
			error: null,
			success: null,
		};
	},

	methods: {
		async submit() {
			this.success = null;
			this.error = null;
			try {
				const res = await this.$authenticator.register({
					firstName: this.firstName,
					lastName: this.lastName,
					email: this.email,
					username: this.username,
					password: this.password
				});
				if (!res)
					this.success = "Account created. Please activate now.";
			} catch(err) {
				//console.log(JSON.stringify(err, null, 2));
				this.error = err.message;
			}
		}
	}
};
</script>

<style lang="scss" scoped>
@import "../styles/auth";
</style>
