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
						<input v-model="entity.public" class="mr-2 leading-tight" type="checkbox" />
						<span class="">{{ $t("Public") }}</span>
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
				title: "",
				description: "",
				public: false
			}
		};
	},

	methods: {
		...mapActions(["updateBoard", "createBoard", "removeBoard"]),

		show(board) {
			if (board) {
				this.pageTitle = this.$t("EditBoard");
				this.entity = { ...board };
				console.log("entity", this.entity);
				this.isUpdate = true;
			} else {
				this.entity = {
					title: "",
					description: "",
					public: false
				};
				this.pageTitle = this.$t("NewBoard");
			}
			this.visible = true;
			this.$nextTick(() => this.$refs.mainInput.focus());
		},

		async removeEntity() {
			await this.removeBoard(this.entity.id);
			this.close();
		},

		close() {
			this.visible = false;
		},

		async save() {
			if (this.entity.id) {
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
