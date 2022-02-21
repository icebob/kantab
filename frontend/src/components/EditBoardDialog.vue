<template>
	<k-dialog v-model="visible" :title="pageTitle">
		<template #default>
			<div class="form-element">
				<label class="block mb-1 text-primary">{{ $t("Title") }}</label>
				<input ref="mainInput" v-model="board.title" type="text" @keydown.enter="save" />
			</div>
			<div class="mt-3 form-element">
				<label class="block mt-2 mb-1 text-primary">{{ $t("Description") }}</label>
				<input v-model="board.description" type="text" />
			</div>
			<div class="mt-3 form-option">
				<input id="public-checkbox" v-model="board.public" type="checkbox" />
				<label for="public-checkbox">{{ $t("Public") }}</label>
			</div>
			<div v-if="board.id" class="mt-3">
				<label class="block mt-2 mb-1 text-primary">Owner</label>
				<div class="ml-4 flex items-center">
					<img
						:src="board.owner.avatar"
						class="w-12 h-12 rounded-full"
						alt="Owner's avatar"
					/>
					<div class="flex-1 ml-4">
						<div class="">{{ board.owner.fullName }}</div>
						<div class="text-muted">{{ board.owner.username }}</div>
					</div>
					<button class="button secondary small outlined w-32">Change ownership</button>
				</div>
			</div>
		</template>

		<template #actions>
			<div
				class="flex justify-between items-center my-4 pt-4 border-t-2 border-t-primary-600"
			>
				<div class="space-x-3">
					<button class="button primary" @click="save()">
						{{ $t("Ok") }}
					</button>
					<button class="button flat" @click="close()">
						{{ $t("Cancel") }}
					</button>
				</div>
				<div v-if="board.id">
					<button class="button danger" :title="$t('Remove')" @click="remove()">
						<i class="fa fa-trash"></i>
					</button>
				</div>
			</div>
		</template>
	</k-dialog>
</template>
<script>
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
			board: {
				title: "",
				description: "",
				public: false
			}
		};
	},

	methods: {
		...mapActions(mainStore, ["updateBoard", "createBoard", "removeBoard"]),

		show(board) {
			if (board) {
				this.pageTitle = this.$t("EditBoard");
				this.board = { ...board };
				this.isUpdate = true;
			} else {
				this.board = {
					title: "",
					description: "",
					public: false
				};
				this.pageTitle = this.$t("NewBoard");
			}
			this.visible = true;
			this.$nextTick(() => this.$refs.mainInput.focus());
		},

		async remove() {
			await this.removeBoard(this.board.id);
			this.close();
		},

		close() {
			this.visible = false;
		},

		async save() {
			if (this.board.id) {
				await this.updateBoard({
					id: this.board.id,
					title: this.board.title,
					description: this.board.description,
					public: this.board.public
				});
			} else {
				await this.createBoard({
					title: this.board.title,
					description: this.board.description,
					public: this.board.public
				});
			}
			this.close();
		}
	}
};
</script>
