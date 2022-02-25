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
					:checked="card.color != null"
					type="checkbox"
					@input="colorCheckboxInput($event)"
				/>
				<label for="custom-color-checkbox">{{ $t("UseCustomColor") }}</label>
			</div>
			<div v-if="card.color != null" class="ml-5 mt-2">
				<div class="mb-2 flex flex-wrap">
					<div
						v-for="c in predefinedColors"
						:key="c"
						class="rounded w-10 h-6 m-1 border border-neutral-900"
						:style="'background: ' + c"
						@click="card.color = c"
					></div>
				</div>
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
			list: null,
			card: null,

			predefinedColors: [
				"#3cb500",
				"#fad900",
				"#ff9f19",
				"#eb4646",
				"#a632db",
				"#0079bf",
				"#00c2e0",
				"#51e898",
				"#ff78cb",
				"#4d4d4d",
				"silver",
				"#ffdab9",
				"#dc143c",
				"plum",
				"#006400",
				"#6a5acd",
				"gold",
				"navy",
				"#8b4513",
				"#afeeee",
				"#ffe4e1",
				"indigo"
			]
		};
	},

	methods: {
		...mapActions(mainStore, ["updateCard", "removeCard"]),

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
