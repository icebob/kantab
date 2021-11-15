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
								v-model="title"
							/>
							<label>Description</label>
							<input
								type="text"
								placeholder="My epic description"
								class="form-control"
								v-model="description"
							/>
						</div>
					</fieldset>
				</div>
			</div>
			<div class="block">
				<button class="button success" @click="update">Save</button>
			</div>
			<div class="block">
				<small class="text-muted">Last modified XXX</small>
			</div>
		</div>
	</div>
</template>
<script>
import { mapActions } from "vuex";
export default {
	data() {
		return {
			visible: false,
			title: "",
			description: "",
			id: null
		};
	},
	methods: {
		...mapActions(["updateBoard"]),
		show(details) {
			this.visible = true;
			this.title = details.title;
			this.description = details.description;
			this.id = details.id;
		},

		close() {
			this.visible = false;
		},
		async update() {
			await this.updateBoard({
				input: { id: this.id, title: this.title, description: this.description }
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
