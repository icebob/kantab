<template>
	<div v-if="visible" class="panel">
		<div class="card dialog">
			<div class="block">
				<div class="content forms">
					<fieldset>
						<legend>{{ pageTitle }}</legend>

						<div class="form-group">
							<label>Title</label>
							<input
								type="text"
								placeholder="My epic title"
								class="form-control"
								v-model="entity.title"
							/>
							<label>Description</label>
							<input
								type="text"
								placeholder="My epic description"
								class="form-control"
								v-model="entity.description"
							/>
							<div v-if="entity.public != null" class="form-option">
								<input v-model="entity.public" id="check2" type="checkbox" /><label
									for="check2"
									>Public</label
								>
							</div>
						</div>
					</fieldset>
				</div>
			</div>
			<div
				class="content flex align-center justify-space-between wrap buttons"
				style="margin: 1em"
			>
				<div>
					<button class="button success" @click="dialogOk(entity)">Ok</button>
					<button class="button" style="margin-left: 10px" @click="close()">
						Cancel
					</button>
				</div>
				<div v-if="isUpdate">
					<button class="button danger" @click="removeEntity(entity)">
						<i class="fa fa-trash"></i>
					</button>
				</div>
			</div>
			<div class="block">
				<small :title="dateToLong(entity.updatedAt)" class="text-muted"
					>Last modified {{ dateToAgo(entity.updatedAt) }}</small
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
			entity: null,
			isUpdate: false
		};
	},

	methods: {
		...mapActions([
			"updateBoard",
			"createBoard",
			"createList",
			"removeBoard",
			"updateList",
			"removeList"
		]),
		show({ type, board, list, boardId }) {
			if (type == "board" && board) {
				this.pageTitle = "Edit board";
				this.entity = board;
				console.log("entity", this.entity);
				this.isUpdate = true;
			} else {
				this.entity = {
					title: "",
					description: "",
					public: false
				};
				this.pageTitle = "Add board";
			}
			if (type == "list" && list && boardId) {
				console.log("list", boardId);
				this.pageTitle = "Edit list";
				this.entity = list;
				this.entity.boardId = boardId;
				this.isUpdate = true;
			} else if (type == "list" && boardId) {
				this.pageTitle = "Add list";
				this.entity = {
					boardId: boardId,
					title: "",
					description: ""
				};
			}
			this.visible = true;
		},
		async removeEntity(entity) {
			if (entity.__typename == "Board") {
				await this.removeBoard(entity.id);
			} else {
				await this.removeList({ id: entity.id });
			}
			this.close();
		},

		close() {
			this.visible = false;
			this.isUpdate = false;
		},

		async dialogOk(entity) {
			console.log("entity", entity);
			if (this.isUpdate) {
				if (entity.__typename == "Board") {
					await this.updateBoard({
						input: {
							id: this.entity.id,
							title: this.entity.title,
							description: this.entity.description,
							public: this.entity.public
						}
					});
				} else {
					await this.updateList({
						input: {
							id: this.entity.id,
							title: this.entity.title,
							description: this.entity.description,
							board: this.entity.boardId
						}
					});
				}
			} else {
				if (!this.entity.boardId) {
					await this.createBoard({
						input: {
							title: this.entity.title,
							description: this.entity.description,
							public: this.entity.public
						}
					});
				} else {
					await this.createList({
						input: {
							board: this.entity.boardId,
							title: this.entity.title,
							description: this.entity.description,
							position: 0,
							color: "red"
						}
					});
				}
			}
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
