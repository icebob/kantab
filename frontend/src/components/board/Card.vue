<template>
	<div
		class="my-1 border border-neutral-700 bg-card shadow rounded-md transition-transform"
		:style="cardStyle"
		@click="editCard"
	>
		<!-- <img
			v-if="coverImage"
			class="w-full h-24 rounded-t-md shadow-lg object-cover"
			:src="coverImage"
		/> -->
		<div class="px-4 py-2">
			<!-- <div class="flex items-center">
				<div class="flex-1 flex gap-2">
					<div
						class="w-8 bg-primary rounded px-2 py-0.5 text-xs text-black text-shadow-sm"
						title="Frontend"
					></div>
					<div
						class="w-8 bg-negative rounded px-2 py-0.5 text-xs text-white text-shadow-sm"
						title="High priority"
					></div>
				</div>
				<div class="flex-1 flex gap-2 flex-wrap">
					<div class="bg-primary rounded px-2 py-0.5 text-xs text-black text-shadow-sm">
						Frontend
					</div>
					<div class="bg-negative rounded px-2 py-0.5 text-xs text-white text-shadow-sm">
						<i class="fa fa-exclamation-circle"></i>
						High priority
					</div>
				</div>
				<div>
					<div class="flex items-baseline text-xs opacity-80">
						<i class="fa fa-comments-o mr-1" />
						<span>3</span>
					</div>
				</div>
			</div> -->
			<div class="my-2 font-bold text-shadow-sm">{{ card.title }}</div>
			<!-- <div class="flex items-center">
				<div class="flex-1 flex-col text-xxs opacity-75">
					<div class="flex items-baseline">
						<i class="fa fa-calendar-o mr-1" />
						<span>Dec 31</span>
					</div>
					<div class="flex mt-0.5 items-baseline">
						<i class="fa fa-flag mr-1" />
						<span>Jan 10</span>
					</div>
				</div>
				<div class="flex items-center">
					<div class="flex">
						<img
							class="h-8 w-8 rounded-full border-2 border-panel object-cover"
							:style="{ borderColor: cardBgColor }"
							src="https://faces-img.xcdn.link/image-lorem-face-1128.jpg"
							alt=""
						/>
						<img
							class="-ml-3 h-8 w-8 rounded-full border-2 border-panel object-cover"
							:style="{ borderColor: cardBgColor }"
							src="https://faces-img.xcdn.link/image-lorem-face-5026.jpg"
							alt=""
						/>
					</div>
				</div>
			</div>
			<div class="mt-2 flex items-baseline">
				<div class="flex-1 progressbar extra-small">
					<div class="progress" style="width: 75%"></div>
				</div>
				<div class="ml-1 text-xxs"><i class="fa fa-check-square-o mr-1" />7/10</div>
			</div> -->
		</div>
	</div>
</template>

<script>
import { mapState } from "pinia";
import { mainStore } from "../../store/store";

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
		...mapState(mainStore, ["userIsMember"]),

		coverImage() {
			return Math.random() > 0.7 ? "https://picsum.photos/id/1041/300/100" : null;
		},

		cardStyle() {
			if (this.card.color) {
				return {
					backgroundColor: this.card.color,
					color: getTextColorByBackgroundColor(this.card.color)
				};
			}
			return {};
		},

		cardBgColor() {
			if (this.card.color) {
				return this.card.color;
			}
			return "rgb(34,39,34)";
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
