<template>
	<dir>
		<Logo />
		<h4>Home</h4>
		<div>
			<button @click="getBoards">Get boards</button>
			<pre v-if="boards"><code>{{ boards }}</code></pre>
		</div>
		<div>
			<button @click="getBoardsApollo">Get boards apollo</button>
			<pre v-if="boardsApollo"><code>{{ boardsApollo.data.boards }}</code></pre>
			<div>
				<input v-model="boardTitle" placeholder="Board title" />
				<button @click="createBoard">Create board</button>
			</div>
		</div>
	</dir>
</template>

<script>
import Logo from "./account/partials/Logo";
import { apolloClient } from "../apollo";
import gql from "graphql-tag";
export default {
	components: {
		Logo
	},

	data() {
		return {
			boards: null,
			boardsApollo: null,
			boardTitle: null
		};
	},

	methods: {
		getBoards() {
			this.$socket.emit("call", "v1.boards.list", { page: 1, pageSize: 5 }, (err, res) => {
				if (err) return alert(err.message);

				this.boards = res;
			});
		},
		async getBoardsApollo() {
			// Call to the graphql mutation
			this.boardsApollo = await apolloClient.query({
				query: gql`
					query {
						boards {
							id
							title
							description
							owner {
								username
								fullName
								boards {
									title
								}
							}
						}
					}
				`
			});
		},
		async createBoard() {
			// Call to the graphql mutation
			apolloClient
				.mutate({
					// Query
					mutation: gql`
						mutation createBoard($title: CreateBoardInput!) {
							createBoard(input: $input) {
								id
							}
						}
					`,

					// Parameters
					variables: { input: { title: this.boardTitle } }
				})
				.then(async data => {
					// Result
					console.log("Token", data.data.login.token);
					const user = await this.applyToken(data.data.login.token);
					console.log("user", user);

					//const { redirect } = store.state.route.query;
					//router.push(redirect ? redirect : { name: "home" });
					//return user;
				})
				.catch(error => {
					// Error
					console.error(error);
					// We restore the initial user input
				});
		}
	}
};
</script>
