<template>
	<div>
		<div v-if="board">
			<div class="m-4 flex items-center justify-space-between wrap">
				<h3>{{ board.title }}</h3>
			</div>
			<div class="m-4 flex items-start">
				<Container
					orientation="horizontal"
					drag-handle-selector=".list-drag-handle"
					:drop-placeholder="listDropPlaceholderOptions"
					:get-child-payload="idx => board.lists.rows[idx]"
					@drop="onListDrop($event)"
				>
					<Draggable v-for="list in board.lists.rows" :key="list.id">
						<div
							class="w-list min-w-list mx-2 bg-panel rounded-md shadow-panel border border-neutral-600"
						>
							<div
								class="flex items-center bg-primary-600 rounded-t-md py-2 px-4 font-title text-lg text-shadow"
								:style="getListHeaderStyle(list)"
							>
								<span v-if="user" class="list-drag-handle cursor-grab"
									>&#x2630;</span
								>
								<span class="ml-2 flex-1"
									>{{ list.title }} ({{ list.position }})</span
								>
								<button
									v-if="user"
									class="button flat small"
									@click="addingCardEditMode(list)"
								>
									<i class="fa fa-plus"></i>
								</button>
								<button
									v-if="user"
									class="button flat small"
									@click="showDialog(list)"
								>
									<i class="fa fa-pencil"></i>
								</button>
							</div>
							<Container
								class="p-2"
								group-name="card"
								drag-class="card-ghost"
								drop-class="card-ghost-drop"
								:drop-placeholder="cardDropPlaceholderOptions"
								:get-child-payload="idx => list.cards.rows[idx]"
								@drop="e => onCardDrop(list, e)"
							>
								<Draggable v-for="card in list.cards.rows" :key="card.id">
									<div
										class="my-2 border border-neutral-700 bg-card shadow rounded-md transition-transform"
									>
										<div class="p-5">
											<div>{{ card.title }} ({{ card.position }})</div>
										</div>
									</div>
								</Draggable>
								<div
									v-if="!addingCard || addingCardList != list.id"
									class="my-2 border-2 border-neutral-600 border-dashed text-neutral-500 rounded-md flex justify-center items-center h-16"
									@click="addingCardEditMode(list)"
								>
									<div class="flex-1 text-center">
										<i class="fa fa-plus text-3xl"></i>
										<div class="text-md">{{ $t("NewCard") }}</div>
									</div>
								</div>
								<div v-else>
									<textarea
										ref="addingCardTextarea"
										v-model="addingCardTitle"
										class="form-input"
										placeholder="Enter card title"
										@keydown.enter.stop.prevent="addCard(list)"
										@keydown.esc.stop.prevent="cancelAddingCard"
									></textarea>
								</div>
							</Container>
						</div>
					</Draggable>
				</Container>

				<div
					class="w-list min-w-list mx-2 border-2 border-neutral-500 border-dashed text-neutral-500 rounded-md flex justify-center items-center h-20"
					@click="showDialog()"
				>
					<div class="flex-1 text-center">
						<i class="fa fa-plus text-3xl"></i>
						<div class="text-md">{{ $t("NewList") }}</div>
					</div>
				</div>
			</div>
		</div>

		<edit-list-dialog ref="editDialog" />
	</div>
</template>
<script>
import { Container, Draggable } from "vue3-smooth-dnd";

import { mapState, mapActions } from "vuex";
import dateFormatter from "../mixins/dateFormatter";
import EditListDialog from "../components/EditListDialog.vue";
import { getTextColorByBackgroundColor } from "../utils";

export default {
	components: {
		EditListDialog,
		Container,
		Draggable
	},
	mixins: [dateFormatter],
	props: {
		id: {
			required: true,
			type: String
		}
	},

	data() {
		return {
			addingCard: false,
			addingCardList: null,
			addingCardTitle: "",

			listDropPlaceholderOptions: {
				className: "cards-drop-preview",
				animationDuration: "150",
				showOnTop: true
			},
			cardDropPlaceholderOptions: {
				className: "drop-preview",
				animationDuration: "150",
				showOnTop: true
			}
		};
	},
	computed: {
		...mapState(["user", "board"])
	},

	watch: {
		async id() {
			await this.getBoardById(this.id);
		}
	},

	async mounted() {
		await this.getBoardById(this.id);
	},

	methods: {
		...mapActions([
			"getBoardById",
			"createCard",
			"updateList",
			"changeListPosition",
			"changeCardPosition"
		]),

		showDialog(list) {
			this.$refs.editDialog.show({ boardId: this.id, list: list });
		},

		addingCardEditMode(list) {
			this.addingCardList = list.id;
			this.addingCardTitle = "";
			this.addingCard = true;

			this.$nextTick(() => {
				this.$refs.addingCardTextarea?.[0]?.focus();
			});
		},

		cancelAddingCard() {
			this.addingCard = false;
			this.addingCardList = null;
			this.addingCardTitle = "";
		},

		async addCard(list) {
			if (this.addingCardTitle.trim() === "") {
				return this.cancelAddingCard();
			}

			await this.createCard({
				list,
				input: {
					title: this.addingCardTitle,
					list: list.id
				}
			});

			this.addingCardTitle = "";
		},

		async onListDrop(dropResult) {
			const { removedIndex, addedIndex } = dropResult;
			if ((removedIndex == null && addedIndex == null) || removedIndex == addedIndex) return;

			await this.changeListPosition({
				fromIndex: removedIndex,
				toIndex: addedIndex
			});
		},

		async onCardDrop(list, dropResult) {
			const { removedIndex, addedIndex, payload } = dropResult;
			if ((removedIndex == null && addedIndex == null) || removedIndex == addedIndex) return;

			console.log("dropResult", list.title, dropResult);
			await this.changeCardPosition({
				list,
				fromIndex: removedIndex,
				toIndex: addedIndex,
				card: payload
			});
		},

		getListHeaderStyle(list) {
			if (list.color) {
				return {
					backgroundColor: list.color,
					color: getTextColorByBackgroundColor(list.color)
				};
			}
		}
	}
};
</script>

<style lang="scss" scoped>
.card-ghost {
	transition: transform 0.18s ease;
	transform: rotateZ(5deg);
}

.card-ghost-drop {
	transition: transform 0.18s ease-in-out;
	transform: rotateZ(0deg);
}
</style>
