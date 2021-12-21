<template>
	<k-dialog v-model="visible" :title="pageTitle">
		<template #default>
			<div class="">
				<div>
					<label class="block mb-1">{{ $t("Title") }}</label>
					<input ref="mainInput" v-model="entity.title" type="text" class="k-input" />
				</div>
				<div class="mt-3">
					<label class="block mt-2 mb-1">{{ $t("Description") }}</label>
					<input v-model="entity.description" type="text" class="k-input" />
				</div>
				<div class="mt-3">
					<label class="block select-none">
						<input
							class="mr-2 leading-tight"
							type="checkbox"
							:value="entity.color != null"
							@input="colorCheckboxInput($event)"
						/>
						<span class="">{{ $t("UseCustomColor") }}</span>
						<div v-if="entity.color != null" class="ml-5 mt-2">
							<input v-model="entity.color" type="color" class="h-8 w-16" />
						</div>
					</label>
				</div>
			</div>
		</template>

		<template #actions>
			<div class="flex justify-between items-center my-4">
				<div class="space-x-3">
					<button class="k-button primary" @click="save()">
						{{ $t("Ok") }}
					</button>
					<button class="k-button flat" @click="close()">
						{{ $t("Cancel") }}
					</button>
				</div>
				<div v-if="entity.id">
					<button class="k-button danger" :title="$t('Remove')" @click="removeEntity()">
						<i class="fa fa-trash"></i>
					</button>
				</div>
			</div>
		</template>
	</k-dialog>
</template>
<script>
import { mapActions } from "vuex";
import KDialog from "./Dialog.vue";

export default {
	components: {
		KDialog
	},

	data() {
		return {
			visible: false,
			pageTitle: "",
			entity: {
				boardId: null,
				title: "",
				description: "",
				color: null
			},
			boardId: null
		};
	},

	methods: {
		...mapActions(["createList", "updateList", "removeList"]),
		show({ list, boardId }) {
			if (list) {
				this.pageTitle = this.$t("EditList");
				this.entity = list;
			} else {
				this.pageTitle = this.$t("NewList");
				this.entity = {
					boardId: boardId,
					title: "",
					description: "",
					color: null
				};
			}
			this.boardId = boardId;
			this.visible = true;
			this.$nextTick(() => this.$refs.mainInput.focus());
		},
		async removeEntity() {
			await this.removeList({ id: this.entity.id });
			this.close();
		},

		colorCheckboxInput(event) {
			if (!event.target.checked) {
				this.entity.color = null;
			} else {
				this.entity.color = "#000";
			}
		},

		close() {
			this.visible = false;
		},

		async save() {
			if (this.entity.id) {
				await this.updateList({
					id: this.entity.id,
					title: this.entity.title,
					description: this.entity.description,
					color: this.entity.color,
					board: this.boardId
				});
			} else {
				await this.createList({
					board: this.boardId,
					title: this.entity.title,
					description: this.entity.description,
					color: this.entity.color
				});
			}
			this.close();
		}
	}
};
</script>
