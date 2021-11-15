<template>
	<div>
		<h2>Login with Apollo</h2>
		<form
			action=""
			method="POST"
			@submit.prevent="$authenticator.loginApollo(username, password)"
		>
			<div>
				<input v-model="username" name="username" id="username" placeholder="Email" />
			</div>
			<div>
				<input
					type="password"
					v-model="password"
					name="password"
					id="password"
					placeholder="Enter password"
				/>
			</div>
			<div>
				<button>Login</button>
			</div>
		</form>
		<button @click="getMe">get me</button>
		<div></div>
	</div>
</template>
<script>
import { mapState, mapActions } from "vuex";
export default {
	data() {
		return {
			username: "",
			password: ""
		};
	},
	methods: {
		...mapActions(["getMeApollo"]),
		getMe() {
			console.log("meh");
			this.getMeApollo();
		}
		/* 		login() {
			// Call to the graphql mutation
			this.$apollo
				.mutate({
					// Query
					mutation: gql`
						mutation login($email: String!, $password: String!) {
							login(email: $email, password: $password) {
								token
							}
						}
					`,

					// Parameters
					variables: { email: this.username, password: this.password }
				})
				.then(data => {
					// Result
					console.log(data);
				})
				.catch(error => {
					// Error
					console.error(error);
					// We restore the initial user input
				});
		} */
	}
};
</script>

<style scoped>
input {
	padding: 14px 20px;
	font-size: 18px;
	margin-bottom: 14px;
}

button {
	width: 160px;
	padding: 14px;
	background: #017bff;
	color: white;
	font-size: 16px;
}
</style>
