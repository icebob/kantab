<template>
	<div v-if="board" class="flex-1 h-full flex flex-col overflow-y-hidden">
		<div class="m-4">
			<h3>{{ board.title }}</h3>
		</div>
		<Container
			class="flex-1 mx-4 h-full flex overflow-x-auto gap-4 p-4"
			group-name="cols"
			tag="div"
			orientation="horizontal"
			:get-child-payload="idx => board.lists.rows[idx]"
			@drop="onListDrop($event)"
		>
			<Draggable
				v-for="list in board.lists.rows"
				:key="list.id"
				class="w-list min-w-list h-full flex-shrink-0 mx-2 bg-panel rounded-md shadow-panel border border-neutral-600"
			>
				<div class="h-full flex flex-col">
					<!-- header-->
					<div
						class="flex items-center bg-primary-600 rounded-t-md py-2 px-2 font-title text-lg text-shadow"
						:style="getListHeaderStyle(list)"
					>
						<span class="ml-2 flex-1">{{ list.title }}</span>
						<template v-if="user">
							<button class="button flat small" @click="addingCardEditMode(list)">
								<i class="fa fa-plus" />
							</button>
							<button class="button flat small" @click="showDialog(list)">
								<i class="fa fa-pencil" />
							</button>
						</template>
					</div>
					<!-- column -->
					<Container
						class="p-2 flex-grow overflow-y-auto overflow-x-hidden"
						orientation="vertical"
						group-name="col-items"
						:get-child-payload="idx => list.cards.rows[idx]"
						:drop-placeholder="{
							className: `bg-primary bg-opacity-20
            border-dotted border-2
            border-primary rounded-lg mx-4 my-2`,
							animationDuration: '200',
							showOnTop: true
						}"
						drag-class="bg-primary dark:bg-primary
            border-2 border-primary-hover text-white
            transition duration-100 ease-in z-50
            transform rotate-6 scale-110"
						drop-class="transition duration-100
            ease-in z-50 transform
            -rotate-2 scale-90"
						@drop="e => onCardDrop(list, e)"
					>
						<!-- Items -->
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
						<div v-else class="form-element">
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
			<div
				class="w-list min-w-list mx-2 border-2 border-neutral-500 border-dashed text-neutral-500 rounded-md flex justify-center items-center h-20"
				@click="showDialog()"
			>
				<div class="flex-1 text-center">
					<i class="fa fa-plus text-3xl"></i>
					<div class="text-md">{{ $t("NewList") }}</div>
				</div>
			</div>
		</Container>
	</div>
</template>

<script>
import { Container, Draggable } from "vue3-smooth-dnd";
import KanbanItem from "../components/KanbanItem.vue";

import { mapState, mapActions } from "vuex";
import dateFormatter from "../mixins/dateFormatter";
import EditListDialog from "../components/EditListDialog.vue";
import { getTextColorByBackgroundColor } from "../utils";

export default {
	components: {
		KanbanItem,
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
			await this.selectBoardById(this.id);
		}
	},

	async mounted() {
		await this.selectBoardById(this.id);
	},

	methods: {
		...mapActions([
			"selectBoardById",
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
<style>
/** NB: dont remove,
* When using orientation="horizontal" it auto sets "display: table"
* In this case we need flex and not display table
*/
.smooth-dnd-container.horizontal {
	display: flex !important;
}
</style>
