<template>
	<k-dialog v-model="visible" :title="pageTitle">
		<template #default>
			<div class="form-element">
				<label class="block mb-1">{{ $t("Title") }}</label>
				<input
					ref="mainInput"
					v-model="list.title"
					type="text"
					class="form-input"
					@keydown.enter="save"
				/>
			</div>
			<div class="mt-3 form-element">
				<label class="block mt-2 mb-1">{{ $t("Description") }}</label>
				<input v-model="list.description" type="text" class="form-input" />
			</div>
			<div class="mt-3 form-option">
				<input
					id="custom-color-checkbox"
					:value="list.color != null"
					type="checkbox"
					@input="colorCheckboxInput($event)"
				/>
				<label for="custom-color-checkbox">{{ $t("UseCustomColor") }}</label>
			</div>
			<div v-if="list.color != null" class="ml-5 mt-2">
				<input v-model="list.color" type="color" class="h-8 w-16 rounded" />
			</div>
		</template>

		<template #actions>
			<div class="flex justify-between items-center my-4">
				<div class="space-x-3">
					<button class="button primary" @click="save()">
						{{ $t("Ok") }}
					</button>
					<button class="button flat" @click="close()">
						{{ $t("Cancel") }}
					</button>
				</div>
				<div v-if="list.id">
					<button class="button danger" :title="$t('Remove')" @click="remove()">
						<i class="fa fa-trash"></i>
					</button>
				</div>
			</div>
		</template>
	</k-dialog>
</template>
<script>
import { cloneDeep } from "lodash";
import { mapActions } from "pinia";
import { mainStore } from "../store/store";
import KDialog from "./Dialog.vue";

export default {
	components: {
		KDialog
	},

	data() {
		return {
			visible: false,
			pageTitle: "",
			list: {
				boardId: null,
				title: "",
				description: "",
				color: null
			},
			boardId: null
		};
	},

	methods: {
		...mapActions(mainStore, ["createList", "updateList", "removeList"]),

		show({ list, boardId }) {
			if (list) {
				this.pageTitle = this.$t("EditList");
				this.list = cloneDeep(list);
			} else {
				this.pageTitle = this.$t("NewList");
				this.list = {
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

		async remove() {
			await this.removeList({ id: this.list.id });
			this.close();
		},

		colorCheckboxInput(event) {
			if (!event.target.checked) {
				this.list.color = null;
			} else {
				this.list.color = "#000";
			}
		},

		close() {
			this.visible = false;
		},

		async save() {
			if (this.list.id) {
				await this.updateList({
					id: this.list.id,
					title: this.list.title,
					description: this.list.description,
					color: this.list.color,
					board: this.boardId
				});
			} else {
				await this.createList({
					board: this.boardId,
					title: this.list.title,
					description: this.list.description,
					color: this.list.color
				});
			}
			this.close();
		}
	}
};
</script>
