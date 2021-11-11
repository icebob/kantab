<template>
	<dir>
		<Logo />
		<h4>Home</h4>
		<div style="margin: 15px">
			<button class="button primary" @click="getBoards">Get boards</button>
			<pre v-if="boards"><code>{{ boards }}</code></pre>
		</div>
		<div style="margin: 15px" class="form-group">
			<button class="button primary" @click="getBoardWApollo">Get boards apollo</button>
			<!-- <pre v-if="boardsApollo"><code>{{ boardsApollo}}</code></pre> -->
			<fieldset>
				<div
					class="content flex align-start justify-space-around panels"
					v-for="board in boardsApollo"
					:key="board.id"
				>
					<div class="card">
						<div class="block">
							<div>
								<span class="title">{{ board.title }}</span>
								<button
									style="margin: 5px"
									class="button small primary"
									@click="removeBoard(board.id)"
								>
									X
								</button>
							</div>
							<div class="body">
								<span>{{ board.id }}</span>

								<div>
									<input
										class="form-control"
										v-model="newTitle"
										placeholder="New title"
									/>
									<button
										style="margin: 10px"
										class="button primary"
										@click="updateBoard(board.id)"
									>
										Update title
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</fieldset>
			<div class="new-board-panel">
				<input
					style="padding: 15px"
					class="form-control"
					v-model="boardTitle"
					placeholder="Board title"
				/>
				<button style="margin: 15px" class="button primary" @click="createBoard">
					Create board
				</button>
			</div>
			<!-- 			<div>
				<input v-model="newTitle" placeholder="New title" />
				<button @click="updateBoard">Update board</button>
			</div> -->
		</div>
	</dir>
</template>

<script>
import Logo from "./account/partials/Logo";
import { apolloClient } from "../apollo";
import gql from "graphql-tag";

import { getBoardsApollo } from "../graphql/queries";
export default {
	components: {
		Logo
	},

	data() {
		return {
			boards: null,
			boardsApollo: null,
			boardTitle: null,
			newTitle: "",
			updateId: "axGe9EDWrQT5vXradJQr"
		};
	},

	methods: {
		getBoards() {
			this.$socket.emit("call", "v1.boards.list", { page: 1, pageSize: 5 }, (err, res) => {
				if (err) return alert(err.message);

				this.boards = res;
			});
		},
		async getBoardWApollo() {
			this.boardsApollo = await getBoardsApollo();
		},
		/* 		async getBoardsApollo() {
			// Call to the graphql mutation
			const res = await apolloClient.query({
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
			this.boardsApollo = res.data.boards;
		}, */
		async createBoard() {
			// Call to the graphql mutation
			apolloClient
				.mutate({
					// Query
					mutation: gql`
						mutation createBoard($input: CreateBoardInput!) {
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
					console.log("Board created", data);
				})
				.catch(error => {
					// Error
					console.error(error);
				});
		},
		async removeBoard(id) {
			// Call to the graphql mutation
			apolloClient
				.mutate({
					// Query
					mutation: gql`
						mutation removeBoard($id: String!) {
							removeBoard(id: $id)
						}
					`,

					// Parameters
					variables: { id }
				})
				.then(async data => {
					// Result
					console.log("Deleted", data);
				})
				.catch(error => {
					// Error
					console.error(error);
				});
		},
		updateBoard(id) {
			// Call to the graphql mutation
			apolloClient
				.mutate({
					// Query
					mutation: gql`
						mutation updateBoard($input: UpdateBoardInput!) {
							updateBoard(input: $input) {
								id
							}
						}
					`,

					// Parameters
					variables: { input: { id, title: this.newTitle } }
				})
				.then(async data => {
					// Result
					console.log("Board created", data);
				})
				.catch(error => {
					// Error
					console.error(error);
				});
		}
	}
};
</script>
