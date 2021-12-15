<template>
	<div>
		<div v-if="board">
			<div class="content flex align-center justify-space-between wrap" style="margin: 1em">
				<h3>{{ board.title }}</h3>
			</div>
			<div class="content flex align-start" style="margin: 1em">
				<Container
					orientation="horizontal"
					drag-handle-selector=".list-drag-handle"
					:drop-placeholder="listDropPlaceholderOptions"
					:get-child-payload="idx => board.lists.rows[idx]"
					@drop="onListDrop($event)"
				>
					<Draggable v-for="list in board.lists.rows" :key="list.id">
						<div class="list panel primary">
							<div class="header flex align-center" :style="getListHeaderStyle(list)">
								<span v-if="user" class="list-drag-handle">&#x2630;</span>
								<span class="list-title flex-item-1"
									>{{ list.title }} ({{ list.position }})</span
								>
								<button
									v-if="user"
									class="button outline small"
									@click="showDialog(list)"
								>
									<i class="fa fa-pencil"></i>
								</button>
							</div>
							<Container
								class="list-content"
								group-name="col"
								drag-class="card-ghost"
								drop-class="card-ghost-drop"
								:drop-placeholder="cardDropPlaceholderOptions"
								:get-child-payload="idx => list.cards.rows[idx]"
								@drop="e => onCardDrop(list, e)"
							>
								<Draggable v-for="card in list.cards.rows" :key="card.id">
									<div class="card">
										<div class="block">
											<div>{{ card.title }} ({{ card.position }})</div>
										</div>
									</div>
								</Draggable>
								<div
									v-if="!addingCard || addingCardList != list.id"
									class="new-card-placeholder"
									@click="addingCardEditMode(list)"
								>
									<div class="icon">
										<i class="fa fa-plus"></i>
									</div>
									<div class="label">Add card</div>
								</div>
								<div v-else>
									<textarea
										ref="addingCardTextarea"
										v-model="addingCardTitle"
										class="adding-card-textarea"
										placeholder="Enter card title"
										@keydown.enter.stop.prevent="addCard(list)"
										@keydown.esc.stop.prevent="cancelAddingCard"
									></textarea>
								</div>
							</Container>
						</div>
					</Draggable>
				</Container>
				<div class="new-list-placeholder" @click="showDialog()">
					<div class="icon">
						<i class="fa fa-plus"></i>
					</div>
					<div class="label">New list</div>
				</div>
			</div>
		</div>

		<edit-list-dialog ref="editDialog" />
	</div>
</template>
<script>
import { Container, Draggable } from "vue3-smooth-dnd";

import { mapState, mapActions } from "vuex";
import dateFormatter from "../../mixins/dateFormatter";
import EditListDialog from "../EditListDialog.vue";
import { getTextColorByBackgroundColor } from "../../utils";

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
.list {
	width: 280px;
	margin: 0 0.5em;

	&.panel {
		border: 1px solid #3c4348;
	}

	.list-drag-handle {
		cursor: grab;
	}

	.list-title {
		margin-left: 0.5em;
	}

	.header {
		padding: 0.4em 0.8em;
		.button {
			border: none;
			box-shadow: none;
			padding: 2px 4px;
			color: inherit;
		}
	}

	.list-content {
		padding: 0.5em;

		.card {
			margin: 0.5em 0;
			border: 1px solid #3c4348;
			box-shadow: 0 3px 5px 0 rgb(black, 0.25);
			background-color: #22272b;
			transition: transform 0.2s ease-in-out;
		}

		.card-ghost {
			transition: transform 0.18s ease;
			transform: rotateZ(5deg);
		}

		.card-ghost-drop {
			transition: transform 0.18s ease-in-out;
			transform: rotateZ(0deg);
		}
	}
}

.new-list-placeholder,
.new-card-placeholder {
	padding: 0.5em;

	border: 2px dashed #666;
	border-radius: 8px;
	color: #666;
	cursor: pointer;

	display: flex;
	flex-direction: column;
	align-items: center;

	.icon {
		flex: 1;
		display: flex;
		align-items: center;
		font-size: 2em;
		.fa {
			transition: transform 0.2s ease-in-out;
		}
	}
}

.new-list-placeholder {
	width: 240px;
	min-width: 240px;
	height: 80px;
}

.adding-card-textarea {
	height: 70px;
	width: 100%;
	background: black;
	color: white;

	overflow: hidden;
	overflow-wrap: break-word;
	resize: none;
}
</style>
