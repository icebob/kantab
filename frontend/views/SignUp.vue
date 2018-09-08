<template>
<page-content>
	<page-center>
		<logo />
		<form @submit.prevent="submit">
			<div class="alert error">{{ error }}</div>
			<fieldset class="email">
				<input type="email" v-model="email" placeholder="E-mail" required />
				<i class="fa fa-envelope"></i>
			</fieldset>
			<fieldset class="username">
				<input type="text" v-model="username" placeholder="Username" required />
				<i class="fa fa-user"></i>
			</fieldset>
			<fieldset class="password">
				<input type="password" v-model="password" placeholder="Password" />
				<i class="fa fa-lock"></i>
				<span class="hint">Leave empty for passwordless account</span>
			</fieldset>
			<fieldset>
				<input type="submit" value="Sign Up" />
			</fieldset>
			<fieldset>
				<span>Do you have an account?</span>
				<router-link to="/login"> Sign In</router-link>
			</fieldset>
		</form>
		<hr/>
		<social-auth />
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
			username: "",
			password: ""
		};
	},

	methods: {
		async submit() {
			this.error = null;
			try {
				const res = await this.$authenticator.register(this.email, this.username, this.password);
				console.log("Me:", res);
			} catch(err) {
				//console.log(JSON.stringify(err, null, 2));
				this.error = err.message;
			}
		}
	}
};
</script>

<style lang="scss" scoped>
@import "../styles/variables";

$w: 250px;

.content {
	position: absolute;
	left: 0; right: 0; top: 0; bottom: 0;

	height: 100%;
	min-height: 100%;
}

.wrap-outer {
	display: flex;
    align-items: center;
    justify-content: center;

	width: 100%;
	height: 100%;
}

@import "../styles/auth";

</style>
