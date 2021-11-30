<template>
	<div>
		<div v-if="board">
			<div class="content flex align-center justify-space-between wrap" style="margin: 1em">
				<h3>{{ board.title }}</h3>
				<button class="button primary" @click="showDialog()">
					<i class="fa fa-plus"></i>
				</button>
			</div>
			<div class="content flex align-start" style="margin: 1em">
				<Container
					orientation="horizontal"
					@drop="onColumnDrop($event)"
					drag-handle-selector=".list-drag-handle"
					@drag-start="dragStart"
					:drop-placeholder="upperDropPlaceholderOptions"
				>
					<Draggable v-for="column in lists" :key="column.id">
						<div class="list panel primary">
							<div class="header flex align-center">
								<span class="list-drag-handle">&#x2630;</span>
								<span class="list-title flex-item-1">{{ column.title }}</span>
								<button class="button outline small" @click="showDialog(column)">
									<i class="fa fa-pencil"></i>
								</button>
							</div>
							<Container
								group-name="col"
								@drop="e => onCardDrop(column.id, e)"
								@drag-start="e => log('drag start', e)"
								@drag-end="e => log('drag end', e)"
								:get-child-payload="getCardPayload(column.id)"
								drag-class="card-ghost"
								drop-class="card-ghost-drop"
								:drop-placeholder="dropPlaceholderOptions"
							>
								<Draggable v-for="card in column.children" :key="card.id">
									<div :class="card.props.className" :style="card.props.style">
										<p>{{ card.data }}</p>
									</div>
								</Draggable>
							</Container>
						</div>
					</Draggable>
				</Container>
			</div>
		</div>

		<edit-board-dialog ref="editDialog" />
	</div>
</template>
<script>
import { Container, Draggable } from "vue-smooth-dnd";

import { mapState, mapActions } from "vuex";
import dateFormatter from "../../mixins/dateFormatter";
import EditBoardDialog from "../EditBoardDialog";

export default {
	props: {
		id: {
			required: true,
			type: String
		}
	},
	components: {
		EditBoardDialog,
		Container,
		Draggable
	},
	mixins: [dateFormatter],

	data() {
		return {
			upperDropPlaceholderOptions: {
				className: "cards-drop-preview",
				animationDuration: "150",
				showOnTop: true
			},
			dropPlaceholderOptions: {
				className: "drop-preview",
				animationDuration: "150",
				showOnTop: true
			}
		};
	},
	computed: {
		...mapState(["board", "lists"])
	},
	methods: {
		...mapActions(["getBoardById", "getLists"]),
		showDialog(list) {
			this.$refs.editDialog.show({ type: "list", boardId: this.id, list: list });
		},
		onColumnDrop(dropResult) {
			const scene = Object.assign({}, this.scene);
			//scene.children = applyDrag(scene.children, dropResult);
			this.scene = scene;
		},
		onCardDrop(columnId, dropResult) {
			if (dropResult.removedIndex !== null || dropResult.addedIndex !== null) {
				const scene = Object.assign({}, this.scene);
				const column = scene.children.filter(p => p.id === columnId)[0];
				const columnIndex = scene.children.indexOf(column);
				const newColumn = Object.assign({}, column);
				//newColumn.children = applyDrag(newColumn.children, dropResult);
				scene.children.splice(columnIndex, 1, newColumn);
				this.scene = scene;
			}
		},
		getCardPayload(columnId) {
			return index => {
				return this.scene.children.filter(p => p.id === columnId)[0].children[index];
			};
		},
		dragStart() {
			console.log("drag started");
		},
		log(...params) {
			console.log(...params);
		},
		applyDrag(arr, dragResult) {
			const { removedIndex, addedIndex, payload } = dragResult;
			if (removedIndex === null && addedIndex === null) return arr;

			const result = [...arr];
			let itemToAdd = payload;

			if (removedIndex !== null) {
				itemToAdd = result.splice(removedIndex, 1)[0];
			}

			if (addedIndex !== null) {
				result.splice(addedIndex, 0, itemToAdd);
			}

			return result;
		}
	},
	async created() {
		await this.getBoardById(this.id);
		await this.getLists(this.id);
	},
	watch: {
		async id() {
			await this.getBoardById(this.id);
			console.log("this.id", this.id);
			await this.getLists(this.id);
		}
	}
};
</script>

<style lang="scss" scoped>
.list {
	width: 320px;
	margin: 0 1em;

	.list-drag-handle {
		cursor: grab;
	}

	.list-title {
		margin-left: 0.5em;
	}
}
</style>
