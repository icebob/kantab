<template>
	<transition name="fade">
		<div
			v-if="visible"
			class="fixed top-0 right-0 bottom-0 left-0 bg-black bg-opacity-50 flex justify-center items-center"
			@click="close()"
		>
			<div
				class="w-[400px] max-w-full border border-neutral-500 rounded-md bg-panel shadow-2xl"
			>
				<div class="px-5 pt-5">
					<div class="">
						<div
							class="mb-3 font-title font-light text-xl uppercase pb-1 border-b-2 border-primary-600"
						>
							{{ pageTitle }}
						</div>
						<div>
							<label class="block">Title</label>
							<input
								ref="mainInput"
								v-model="entity.title"
								type="text"
								placeholder="My epic title"
								class="k-input"
							/>
						</div>
						<div class="mt-2">
							<label class="mt-2">Description</label>
							<input
								v-model="entity.description"
								type="text"
								placeholder="My epic description"
								class="k-input"
							/>
						</div>
						<div class="mt-2">
							<label class="block select-none">
								<input
									v-model="entity.public"
									class="mr-2 leading-tight"
									type="checkbox"
								/>
								<span class="">Public</span>
							</label>
						</div>
					</div>
				</div>

				<div class="flex justify-between items-center m-4">
					<div class="space-x-3">
						<button class="k-button primary" @click="dialogOk(entity)">Ok</button>
						<button class="k-button outlined" @click="close()">Cancel</button>
					</div>
					<div v-if="isUpdate">
						<button class="k-button danger" @click="removeEntity(entity)">
							<i class="fa fa-trash"></i>
						</button>
					</div>
				</div>
			</div>
		</div>
	</transition>
</template>
<script>
import { mapActions } from "vuex";

export default {
	data() {
		return {
			visible: false,
			pageTitle: "Add board",
			entity: {
				title: "",
				description: "",
				public: false
			},
			isUpdate: false
		};
	},

	methods: {
		...mapActions(["updateBoard", "createBoard", "removeBoard"]),

		show(board) {
			if (board) {
				this.pageTitle = "Edit board";
				this.entity = { ...board };
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
			this.visible = true;
			this.$nextTick(() => this.$refs.mainInput.focus());
		},

		async removeEntity(entity) {
			await this.removeBoard(entity.id);
			this.close();
		},

		close() {
			this.visible = false;
			this.isUpdate = false;
		},

		async dialogOk(entity) {
			console.log("entity", entity);
			if (this.isUpdate) {
				await this.updateBoard({
					id: this.entity.id,
					title: this.entity.title,
					description: this.entity.description,
					public: this.entity.public
				});
			} else {
				await this.createBoard({
					title: this.entity.title,
					description: this.entity.description,
					public: this.entity.public
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
