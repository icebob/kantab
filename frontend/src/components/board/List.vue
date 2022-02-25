<template>
	<div
		class="h-full flex-shrink-0 bg-panel rounded-md border border-neutral-600 flex flex-col transition-all"
		:class="{
			'w-10': collapsed,
			'min-w-0': collapsed,
			'w-list': !collapsed,
			'min-w-list': !collapsed
		}"
	>
		<div
			class="list-header flex items-center bg-primary-600 rounded-t-md p-2 font-title text-lg text-shadow"
			:style="headerStyle"
			@dblclick="editList"
		>
			<template v-if="!collapsed">
				<span class="ml-2 flex-1 cursor-default"
					>{{ list.title }}
					<span v-if="list.cards.total > 0" class="ml-1 text-sm opacity-75"
						>({{ list.cards.total }})</span
					>
				</span>
				<template v-if="userIsMember">
					<button class="button flat small" @click="newCardEditMode('top', list)">
						<i class="fa fa-plus" />
					</button>
					<button class="button flat small" @click="editList">
						<i class="fa fa-bars" />
					</button>
				</template>
				<button class="button flat small" @click="collapsed = true">
					<i class="fa fa-chevron-left" />
				</button>
			</template>
			<button v-else class="button flat small -ml-1.5" @click="collapsed = false">
				<i class="fa fa-chevron-right" />
			</button>
		</div>
		<template v-if="!collapsed">
			<Container
				class="p-2 flex-grow overflow-y-auto overflow-x-hidden"
				orientation="vertical"
				group-name="card"
				drag-class="card-ghost"
				drop-class="card-ghost-drop"
				:drop-placeholder="cardDropPlaceholderOptions"
				:get-child-payload="idx => list.cards.rows[idx]"
				@drop="onCardDrop"
			>
				<div v-if="userIsMember && newCard == 'top'">
					<new-card :list="list" :position-type="newCard" @cancel="cancelNewCard" />
				</div>
				<component :is="cardComponentType" v-for="card in list.cards.rows" :key="card.id">
					<BoardCard :card="card" :list="list" :board="board" />
				</component>
				<template v-if="userIsMember">
					<div
						v-if="!newCard"
						class="h-10 my-2 text-neutral-500 rounded-md flex justify-center items-center hover:text-neutral-400 transition-colors cursor-pointer"
						@click="newCardEditMode('bottom', list)"
					>
						<div class="flex-1 flex justify-center items-center">
							<i class="fa fa-plus mr-2"></i>
							<span class="text-sm">{{ $t("NewCard") }}</span>
						</div>
					</div>
					<div v-else-if="newCard == 'bottom'">
						<new-card :list="list" :position-type="newCard" @cancel="cancelNewCard" />
					</div>
				</template>
			</Container>
		</template>

		<!-- Collapsed list -->
		<template v-else>
			<div
				class="list-header rotate-180 font-title text-lg text-shadow"
				style="writing-mode: tb-rl"
			>
				<span class="mb-2 mr-1 flex flex-nowrap items-center cursor-default"
					>{{ list.title }}
					<span v-if="list.cards.total > 0" class="mt-2 text-sm opacity-75"
						>({{ list.cards.total }})</span
					>
				</span>
			</div>
		</template>
	</div>
</template>

<script>
import { mapState, mapActions } from "pinia";
import { mainStore } from "../../store/store";
import BoardCard from "./Card.vue";
import NewCard from "./NewCard.vue";
import { Container, Draggable } from "vue3-smooth-dnd";
import { getTextColorByBackgroundColor } from "../../utils";

export default {
	components: {
		BoardCard,
		NewCard,
		Container,
		Draggable
	},

	props: {
		board: { type: Object, required: true },
		list: { type: Object, required: true }
	},

	data() {
		return {
			collapsed: false,
			newCard: null,

			cardDropPlaceholderOptions: {
				className:
					"my-2 mr-4 border-2 border-neutral-600 border-dashed text-neutral-600 rounded-md",
				animationDuration: "150",
				showOnTop: true
			}
		};
	},

	computed: {
		...mapState(mainStore, ["userIsMember"]),

		cardComponentType() {
			return this.userIsMember ? "Draggable" : "div";
		},

		headerStyle() {
			if (this.list.color) {
				return {
					backgroundColor: this.list.color,
					color: getTextColorByBackgroundColor(this.list.color)
				};
			}
			return {};
		}
	},

	methods: {
		...mapActions(mainStore, ["changeCardPosition"]),

		editList() {
			if (this.userIsMember) {
				this.$bus.emit("editList", { list: this.list });
			}
		},

		newCardEditMode(type) {
			if (this.newCard == type) return this.cancelNewCard();
			this.newCard = type;
		},

		cancelNewCard() {
			this.newCard = null;
		},

		async onCardDrop(dropResult) {
			const { removedIndex, addedIndex, payload } = dropResult;
			if ((removedIndex == null && addedIndex == null) || removedIndex == addedIndex) return;

			await this.changeCardPosition({
				list: this.list,
				fromIndex: removedIndex,
				toIndex: addedIndex,
				card: payload
			});
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
