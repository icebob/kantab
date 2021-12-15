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
								ref="mainInput"
								v-model="entity.title"
								type="text"
								placeholder="My epic title"
								class="form-control"
							/>
							<label>Description</label>
							<input
								v-model="entity.description"
								type="text"
								placeholder="My epic description"
								class="form-control"
							/>
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
			boardId: null,
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
		show({ list, boardId }) {
			if (list) {
				this.pageTitle = "Edit list";
				this.entity = list;
				this.isUpdate = true;
			} else {
				this.pageTitle = "Add list";
				this.entity = {
					boardId: boardId,
					title: "",
					description: ""
				};
			}
			this.boardId = boardId;
			this.visible = true;
			this.$nextTick(() => this.$refs.mainInput.focus());
		},
		async removeEntity(entity) {
			await this.removeList({ id: entity.id });
			this.close();
		},

		close() {
			this.visible = false;
			this.isUpdate = false;
		},

		async dialogOk(entity) {
			console.log("entity", entity);
			if (this.isUpdate) {
				await this.updateList({
					id: this.entity.id,
					title: this.entity.title,
					description: this.entity.description,
					board: this.boardId
				});
			} else {
				await this.createList({
					board: this.boardId,
					title: this.entity.title,
					description: this.entity.description
				});
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