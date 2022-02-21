<template>
	<div v-if="board" class="flex-1 h-full flex flex-col overflow-y-hidden">
		<div class="m-4 flex">
			<h3>{{ board.title }}</h3>
			<button
				v-if="userIsMember"
				class="button flat text-neutral-500 hover:text-text"
				@click="editBoard()"
			>
				<i class="fa fa-pencil" />
			</button>
			<div class="flex-1"></div>
			<div
				class="w-10 h-10 rounded-full border-2 border-panel drop-shadow flex justify-center items-center transition-colors hover:border-text text-neutral-500 hover:text-text cursor-pointer"
			>
				<i class="fa fa-user-plus" />
			</div>
			<div class="ml-6 flex flex-row-reverse">
				<div
					v-for="member of board.members"
					:key="member.id"
					class="-ml-5 hover:ml-0 transition-all"
				>
					<img
						class="w-10 h-10 rounded-full border-2 border-panel drop-shadow"
						:src="member.avatar"
						:title="member.fullName + ' (' + member.username + ')'"
						:alt="member.fullName"
					/>
				</div>
			</div>
		</div>

		<Board :board="board" />
		<edit-board-dialog ref="editBoardDialog" />
		<edit-list-dialog ref="editListDialog" />
		<edit-card-dialog ref="editCardDialog" />
	</div>
</template>

<script>
import { mapState, mapActions } from "pinia";
import { authStore } from "../store/authStore";
import { mainStore } from "../store/store";

import Board from "../components/board/Board.vue";

import EditBoardDialog from "../components/EditBoardDialog.vue";
import EditListDialog from "../components/EditListDialog.vue";
import EditCardDialog from "../components/EditCardDialog.vue";

export default {
	components: {
		EditBoardDialog,
		EditListDialog,
		EditCardDialog,
		Board
	},
	props: {
		id: { type: String, default: null }
	},

	computed: {
		...mapState(authStore, ["user"]),
		...mapState(mainStore, ["board"]),
		...mapState(mainStore, ["userIsMember"])
	},

	watch: {
		async id() {
			if (this.id) await this.selectBoardById(this.id);
		}
	},

	async mounted() {
		if (this.id) await this.selectBoardById(this.id);
	},

	events: {
		newList() {
			this.$refs.editListDialog?.show({ list: null, boardId: this.id });
		},

		editList({ list }) {
			this.$refs.editListDialog?.show({ list });
		},

		editCard({ list, card }) {
			this.$refs.editCardDialog?.show({ list, card });
		}
	},

	methods: {
		...mapActions(mainStore, ["selectBoardById"]),

		editBoard() {
			this.$refs.editBoardDialog.show(this.board);
		},

		showListDialog(list) {
			this.$refs.editListDialog.show({ boardId: this.id, list: list });
		}
	}
};
</script>
