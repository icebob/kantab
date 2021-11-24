<template>
	<div>
		<div v-if="board">
			<div
				class="content flex align-center justify-space-between wrap buttons"
				style="margin: 1em"
			>
				<h3>{{ board.title }}</h3>
				<button class="button primary" @click="showDialog()">
					<i class="fa fa-plus"></i>
				</button>
			</div>
			<div class="card-scene">
				<Container
					orientation="horizontal"
					@drop="onColumnDrop($event)"
					drag-handle-selector=".column-drag-handle"
					@drag-start="dragStart"
					:drop-placeholder="upperDropPlaceholderOptions"
				>
					<Draggable v-for="column in lists" :key="column.id">
						<div class="card-container">
							<div
								class="
									card-column-header
									flex
									align-center
									justify-space-between
									wrap
									buttons
								"
							>
								<span class="column-drag-handle">&#x2630;</span>
								{{ column.title }}
								<button class="button outline small" @click="showDialog(column)">
									<i class="fa fa-ellipsis-v"></i>
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
			<!-- 			<div class="card dialog board-panel">
				<div class="block">
					<div class="content card-columns">
						<div v-for="list in lists" :key="list.id">
							<div class="card list-panel">
								<div
									class="
										content
										flex
										align-center
										justify-space-between
										wrap
										buttons
									"
									style="margin: 0.5em"
								>
									<div class="header">{{ list.title }}</div>
									<button class="button outline small" @click="showDialog(list)">
										<i class="fa fa-ellipsis-v"></i>
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="block">
					<small :title="dateToLong(board.updatedAt)" class="text-muted"
						>Last modified {{ dateToAgo(board.updatedAt) }}</small
					>
				</div>
			</div> -->
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
<style scoped>
.board-panel {
	height: 75vh;
	margin: 1em;
}
.list-panel {
	height: 65vh;
	border: none;
}
.card-container {
	width: 320px;
	margin: 5px;
	margin-right: 45px;
	background-color: darkgrey;
	padding: 10px;
	box-shadow: 0 1px 1px rgb(0 0 0 / 12%), 0 1px 1px rgb(0 0 0 / 24%);
}
.card-scene {
	padding: 3em;
}
</style>
