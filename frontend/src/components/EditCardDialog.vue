<template>
	<k-dialog v-model="visible" :title="$t('EditCard')">
		<template #default>
			<div class="form-element">
				<label class="block mb-1">{{ $t("Title") }}</label>
				<input
					ref="mainInput"
					v-model="card.title"
					type="text"
					class="form-input"
					@keydown.enter="save"
				/>
			</div>
			<div class="mt-3 form-element">
				<label class="block mt-2 mb-1">{{ $t("Description") }}</label>
				<input v-model="card.description" type="text" class="form-input" />
			</div>
			<div class="mt-3 form-option">
				<input
					id="custom-color-checkbox"
					:value="card.color != null"
					type="checkbox"
					@input="colorCheckboxInput($event)"
				/>
				<label for="custom-color-checkbox">{{ $t("UseCustomColor") }}</label>
			</div>
			<div v-if="card.color != null" class="ml-5 mt-2">
				<input v-model="card.color" type="color" class="h-8 w-16 rounded" />
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
				<div v-if="card.id">
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
import { mapActions } from "vuex";
import KDialog from "./Dialog.vue";

export default {
	components: {
		KDialog
	},

	data() {
		return {
			visible: false,
			list: null,
			card: null
		};
	},

	methods: {
		...mapActions(["updateCard", "removeCard"]),

		show({ list, card }) {
			this.list = list;
			this.card = cloneDeep(card);
			this.visible = true;
			this.$nextTick(() => this.$refs.mainInput.focus());
		},

		async remove() {
			await this.removeCard({ list: this.list, id: this.card.id });
			this.close();
		},

		colorCheckboxInput(event) {
			if (!event.target.checked) {
				this.card.color = null;
			} else {
				this.card.color = "#000";
			}
		},

		close() {
			this.visible = false;
		},

		async save() {
			await this.updateCard({ list: this.list, input: this.card });
			this.close();
		}
	}
};
</script>
