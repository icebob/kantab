<template>
	<div v-if="visible" class="panel">
		<div class="card dialog">
			<div class="block">
				<div class="content forms">
					<fieldset>
						<legend>Edit board</legend>
						<div class="form-group">
							<label>Title</label>
							<input
								type="text"
								placeholder="My epic board"
								class="form-control"
								v-model="board.title"
							/>
							<label>Description</label>
							<input
								type="text"
								placeholder="My epic description"
								class="form-control"
								v-model="board.description"
							/>
						</div>
					</fieldset>
				</div>
			</div>
			<div class="block">
				<button class="button success" @click="update">Save</button>
			</div>
			<div class="block">
				<small :title="dateToLong(board.updatedAt)" class="text-muted"
					>Last modified {{ dateToAgo(board.updatedAt) }}</small
				>
			</div>
		</div>
	</div>
</template>
<script>
import { mapActions } from "vuex";
import dateFormatter from "../mixins/dateFormatter";

export default {
	mixins: [dateFormatter],
	data() {
		return {
			visible: false,

			board: null
		};
	},

	methods: {
		...mapActions(["updateBoard"]),
		show(board) {
			this.board = board;
			this.visible = true;
		},

		close() {
			this.visible = false;
		},
		async update() {
			await this.updateBoard({
				input: {
					id: this.board.id,
					title: this.board.title,
					description: this.board.description
				}
			});
			this.close();
		}
	}
};
</script>
<style scoped>
.panel {
	background: rgba(0, 0, 0, 0.5);
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
}

.dialog {
	position: fixed;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	width: 400px;
	max-width: 100%;
}
</style>
