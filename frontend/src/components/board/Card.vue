<template>
	<div
		class="my-1 border border-neutral-700 bg-card shadow rounded-md transition-transform"
		:style="cardStyle"
		@click="editCard"
	>
		<div class="p-5">
			<div>{{ card.title }}</div>
		</div>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
import dateFormatter from "../../mixins/dateFormatter";
import { getTextColorByBackgroundColor } from "../../utils";

export default {
	mixins: [dateFormatter],

	props: {
		card: { type: Object, required: true },
		list: { type: Object, required: true },
		board: { type: Object, required: true }
	},

	emits: ["editCard"],

	computed: {
		...mapGetters(["userIsMember"]),

		cardStyle() {
			if (this.card.color) {
				return {
					backgroundColor: this.card.color,
					color: getTextColorByBackgroundColor(this.card.color)
				};
			}
			return {};
		}
	},
	methods: {
		editCard() {
			if (this.userIsMember) {
				this.$bus.emit("editCard", { list: this.list, card: this.card });
			}
		}
	}
};
</script>
