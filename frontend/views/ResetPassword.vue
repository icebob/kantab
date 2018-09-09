<template>
<page-content>
	<page-center>
		<logo />
		<h4>Reset Password</h4>
		<form @submit.prevent="submit">
			<div class="alert error">{{ error }}</div>
			<fieldset class="password">
				<input type="password" v-model="password" placeholder="New Password" />
				<i class="fa fa-lock"></i>
			</fieldset>
			<fieldset>
				<input type="submit" value="Reset Password" />
			</fieldset>
		</form>
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
			email: "",
			username: "",
			password: "",
			error: null,
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
