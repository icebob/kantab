<template>
	<dir>
		<Logo />
		<h4>Home</h4>
		<div style="margin: 15px">
			<button class="button primary" @click="getBoards">Get boards</button>
			<!-- 			<pre v-if="boards"><code>{{ boards }}</code></pre> -->
		</div>
		<div style="margin: 15px" class="form-group">
			<button class="button primary" @click="getBoardApollo">Get boards apollo</button>
			<!-- <pre v-if="boardsApollo"><code>{{ boardsApollo}}</code></pre> -->
			<fieldset v-if="boards" class="content flex align-start justify-space-around panels">
				<div v-for="board in boards" :key="board.id">
					<div class="card" style="margin: 15px">
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
								<div style="margin-bottom: 10px">{{ board.description }}</div>
								<div style="margin-bottom: 10px">{{ board.id }}</div>

								<div>
									<button
										class="button primary"
										@click="
											showEditBoardDialog({
												id: board.id,
												title: board.title,
												description: board.description || ''
											})
										"
									>
										Edit board
									</button>
									<router-link
										:to="{ name: 'Board', params: { id: board.id } }"
										class="button primary"
										style="margin-left: 10px"
									>
										Open
									</router-link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</fieldset>
		</div>
		<div class="form-group new-board-panel">
			<input
				style="padding: 15px; width: 20%"
				class="form-control"
				v-model="boardTitle"
				placeholder="Board title"
			/>
			<button style="margin: 15px" class="button primary" @click="createBoardApollo">
				Create board
			</button>
		</div>
		<edit-board-dialog ref="editDialog" />
	</dir>
</template>

<script>
import Logo from "./account/partials/Logo";
/* import { apolloClient } from "../apollo";
import gql from "graphql-tag"; */
import { mapState, mapActions } from "vuex";
import EditBoardDialog from "../components/EditBoardDialog";

export default {
	components: {
		Logo,
		EditBoardDialog
	},

	data() {
		return {
			//boards: null,
			//boardsApollo: null,
			boardTitle: null,
			newTitle: "",
			updateId: "axGe9EDWrQT5vXradJQr"
		};
	},
	computed: {
		...mapState(["boards"])
	},

	methods: {
		...mapActions(["getBoards", "createBoard", "removeBoard", "updateBoard"]),
		/* 		getBoards() {
			this.$socket.emit("call", "v1.boards.list", { page: 1, pageSize: 5 }, (err, res) => {
				if (err) return alert(err.message);

				this.boards = res;
			});
		}, */
		async getBoardApollo() {
			await this.getBoards();
		},
		async createBoardApollo() {
			await this.createBoard({ input: { title: this.boardTitle } });
		},
		async updateBoardApollo(id) {
			await this.updateBoard({ input: { id, title: this.newTitle } });
		},
		showEditBoardDialog(details) {
			this.$refs.editDialog.show(details);
		}
	}
};
</script>
