<template>
	<dir>
		<Logo />
		<h4>Home</h4>
		<div style="margin: 15px">
			<!-- 			<pre v-if="boards"><code>{{ boards }}</code></pre> -->
			<button v-if="user" style="margin: 15px" class="button primary" @click="showDialog()">
				Create board
			</button>
		</div>
		<div style="margin: 15px" class="form-group">
			<!-- <pre v-if="boardsApollo"><code>{{ boardsApollo}}</code></pre> -->
			<fieldset v-if="boards" class="content flex align-start justify-center panels wrap">
				<div v-for="board in boards" :key="board.id">
					<div class="card" style="margin: 15px">
						<div class="block">
							<div>
								<span class="title">{{ board.title }}</span>
							</div>
							<div class="body">
								<div style="margin-bottom: 10px">{{ board.description }}</div>
								<div style="margin-bottom: 10px">{{ board.id }}</div>

								<div>
									<button v-if="user" class="button" @click="showDialog(board)">
										<i class="fa fa-edit"></i>
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

	computed: {
		...mapState(["boards", "user"])
	},

	methods: {
		showDialog(board) {
			this.$refs.editDialog.show({ type: "board", board });
		}
	}
};
</script>
