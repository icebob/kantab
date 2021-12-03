<template>
	<div>
		<div v-if="board">
			<div class="content flex align-center justify-space-between wrap" style="margin: 1em">
				<h3>{{ board.title }}</h3>
			</div>
			<div class="content flex align-start" style="margin: 1em">
				<Container
					orientation="horizontal"
					@drop="onColumnDrop($event)"
					drag-handle-selector=".list-drag-handle"
					:drop-placeholder="upperDropPlaceholderOptions"
				>
					<Draggable v-for="column in lists" :key="column.position">
						<div class="list panel primary">
							<div class="header flex align-center">
								<span v-if="user" class="list-drag-handle">&#x2630;</span>
								<span class="list-title flex-item-1">{{ column.title }}</span>
								<button
									v-if="user"
									class="button outline small"
									@click="showDialog(column)"
								>
									<i class="fa fa-pencil"></i>
								</button>
							</div>
							<Container
								group-name="col"
								@drop="e => onCardDrop(column.id, e)"
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
				<div class="new-list-placeholder" @click="showDialog()">
					<div class="icon">
						<i class="fa fa-plus"></i>
					</div>
					<div class="label">New list</div>
				</div>
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
		...mapState(["user", "board", "lists"])
	},
	methods: {
		...mapActions(["getBoardById", "getLists", "updateList", "changeListOrder"]),
		showDialog(list) {
			this.$refs.editDialog.show({ type: "list", boardId: this.id, list: list });
		},
		async onColumnDrop(dropResult) {
			this.changeListOrder(dropResult);
			const movedList = this.lists[dropResult.addedIndex];
			let newPosition = 0;
			const toNext = this.lists[dropResult.addedIndex + 1];

			const toPrev = this.lists[dropResult.addedIndex - 1];
			if (dropResult.addedIndex == this.lists.length - 1) {
				newPosition = toPrev.position + 1;
			} else if (dropResult.addedIndex == 0) {
				newPosition = toNext.position - 1;
			} else {
				newPosition = (toNext?.position + toPrev?.position) / 2;
			}

			await this.updateList({
				input: {
					id: movedList.id,
					title: movedList.title,
					description: movedList.description,
					board: movedList.boardId,
					position: newPosition
				}
			});
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

	.header {
		padding: 0.4em 0.8em;
		.button {
			border: none;
			box-shadow: none;
			padding: 2px 4px;
		}
	}
}

.new-list-placeholder {
	width: 240px;
	height: 80px;
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

	&:hover .icon .fa {
		transform: rotate(180deg);
	}

	.label {
	}
}
</style>
