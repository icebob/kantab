<template>
	<Container
		class="flex-1 mx-4 h-full pb-4 flex overflow-x-auto gap-x-4"
		group-name="list"
		orientation="horizontal"
		drag-handle-selector=".list-header"
		:drop-placeholder="listDropPlaceholderOptions"
		:get-child-payload="idx => board.lists.rows[idx]"
		@drop="onListDrop"
	>
		<component :is="listComponentType" v-for="list in board.lists.rows" :key="list.id" class="">
			<BoardList :list="list" :board="board" />
		</component>
		<div
			v-if="userIsMember"
			class="w-list min-w-list h-20 mx-2 border-2 border-neutral-500 border-dashed text-neutral-500 rounded-md flex justify-center items-center hover:border-neutral-400 hover:text-neutral-400 transition-colors"
			@click="$bus.emit('newList')"
		>
			<div class="flex-1 text-center">
				<i class="fa fa-plus text-xl"></i>
				<div class="text-sm">{{ $t("NewList") }}</div>
			</div>
		</div>
	</Container>
</template>

<script>
import { Container, Draggable } from "vue3-smooth-dnd";
import { mapActions, mapState } from "pinia";
import { mainStore } from "../../store/store";
import BoardList from "./List.vue";

export default {
	components: {
		BoardList,
		Container,
		Draggable
	},

	props: {
		board: {
			type: Object,
			required: true
		}
	},

	data() {
		return {
			listDropPlaceholderOptions: {
				className:
					"ml-4 border-2 border-neutral-600 border-dashed text-neutral-600 rounded-md",
				animationDuration: "150",
				showOnTop: true
			}
		};
	},
	computed: {
		...mapState(mainStore, ["userIsMember"]),

		listComponentType() {
			return this.userIsMember ? "Draggable" : "div";
		}
	},

	methods: {
		...mapActions(mainStore, ["changeListPosition"]),

		async onListDrop(dropResult) {
			const { removedIndex, addedIndex } = dropResult;
			if ((removedIndex == null && addedIndex == null) || removedIndex == addedIndex) return;

			await this.changeListPosition({
				fromIndex: removedIndex,
				toIndex: addedIndex
			});
		}
	}
};
</script>
