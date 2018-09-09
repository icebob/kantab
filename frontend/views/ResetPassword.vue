<template>
<page-content>
	<page-center>
		<div class="auth-panel">
			<logo />
			<h4>Reset Password</h4>
			<form @submit.prevent="submit">
				<div v-if="error" class="alert error">{{ error }}</div>
				<div v-if="success" class="alert success">{{ success }}</div>
				<fieldset class="password">
					<input type="password" v-model="password" placeholder="New Password" />
					<i class="fa fa-lock"></i>
				</fieldset>
				<fieldset>
					<input type="submit" value="Reset Password" />
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
			password: "",
			error: null,
			success: null,
		};
	},

	methods: {
		async submit() {
			this.error = null;
			this.success = null;
			try {
				await this.$authenticator.resetPassword(this.$route.query.token, this.password);
				this.success = "Password changed. Logging in...";
				setTimeout(() => this.$router.push({ name: "home" }), 1000);
			} catch(err) {
				this.error = err.message;
			}
		}
	},

	mounted() {
		if (!this.$route.query.token)
			this.error = "Missing token.";
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
