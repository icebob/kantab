<template>
	<div>
		<div class="m-5">
			<h3 class="mb-8 text-center">{{ user ? $t("MyBoards") : $t("PublicBoards") }}</h3>
			<div v-if="boards && boards.length > 0" class="flex justify-center flex-wrap gap-8">
				<div v-for="board in boards" :key="board.id">
					<router-link
						:to="{ name: 'Board', params: { id: board.id, slug: board.slug } }"
						class="div text-nodec"
					>
						<card
							class="w-64"
							:title="board.title"
							:description="board.description"
							:footer="
								$t('ModifiedAt', {
									ago: dateToAgo(board.updatedAt || board.createdAt)
								})
							"
							:ribbon="user && board.public ? $t('Public') : null"
						/>
					</router-link>
				</div>
			</div>
			<div v-else class="mt-8 text-center text-muted">
				You have no boards. Click to the <i class="fa fa-plus" /> button to create one.
			</div>
		</div>

		<div id="add-board-button" class="fixed right-8 bottom-8">
			<div
				class="w-12 h-12 rounded-full bg-primary hover:bg-primary-400 active:bg-primary-600 shadow-lg text-black text-2xl flex justify-center items-center"
				@click="newBoardDialog()"
			>
				<i class="fa fa-plus"></i>
			</div>
		</div>

		<edit-board-dialog ref="editDialog" />
	</div>
</template>

<script>
import { mapState } from "pinia";
import { authStore } from "../store/authStore";
import { mainStore } from "../store/store";

import dateFormatter from "../mixins/dateFormatter";
import EditBoardDialog from "../components/EditBoardDialog.vue";
import Card from "../components/Card.vue";

export default {
	components: {
		Card,
		EditBoardDialog
	},
	mixins: [dateFormatter],

	computed: {
		...mapState(mainStore, ["boards"]),
		...mapState(authStore, ["user"])
	},

	methods: {
		newBoardDialog() {
			if (!this.user) {
				return this.$router.push({ name: "login" });
			}
			this.$refs.editDialog.show();
		}
	}
};
</script>

<style lang="scss" scoped>
.new-board {
	position: fixed;
	bottom: 1em;
	right: 1em;
	z-index: 1;
}
</style>
