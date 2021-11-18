<template>
	<div>
		<div v-if="board">
			<div
				class="content flex align-center justify-space-between wrap buttons"
				style="margin: 1em"
			>
				<h3>{{ board.title }}</h3>
				<button class="button primary" @click="addList"><i class="fa fa-plus"></i></button>
			</div>

			<div class="card dialog board-panel">
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
									<button
										class="button outline small"
										@click="removeList({ id: list.id, board: id })"
									>
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
			</div>
		</div>
	</div>
</template>
<script>
import { mapState, mapActions } from "vuex";
import dateFormatter from "../../mixins/dateFormatter";

export default {
	props: {
		id: {
			required: true,
			type: String
		}
	},
	mixins: [dateFormatter],
	data() {
		return {};
	},
	computed: {
		...mapState(["board", "lists"])
	},
	methods: {
		...mapActions(["getBoardById", "getLists", "createList", "removeList"]),
		async addList() {
			await this.createList({
				input: {
					board: this.id,
					title: "Második lista",
					description: "leírása",
					position: 0,
					color: "red"
				}
			});
		},
		async editList() {}
	},
	async created() {
		await this.getBoardById(this.id);
		await this.getLists(this.id);
	},
	watch: {
		async id() {
			await this.getBoardById(this.id);
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
</style>
