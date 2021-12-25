<template>
	<Draggable v-if="item">
		<div
			class="cursor-move my-2 mx-4 rounded-lg shadow-md bg-gray-800 hover:border-2 border-primary"
		>
			<div
				v-if="item.loading"
				class="flex space-x-2 text-gray-200 bg-gray-900 px-4 py-2 rounded-t-lg"
			>
				<span>Processing...</span>
			</div>
			<div class="p-4 space-y-2">
				<p>{{ item.title }}</p>
			</div>
		</div>
	</Draggable>
</template>

<script>
import { Draggable } from "vue3-smooth-dnd";
export default {
	name: "KanbanItem",
	components: { Draggable },
	props: {
		item: Object
	}
};
</script>
