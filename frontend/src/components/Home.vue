<template>
	<div>
		<Logo />
		<div style="margin: 15px" class="form-group">
			<div v-if="boards" class="content flex align-start justify-center panels wrap">
				<div v-for="board in boards" :key="board.id">
					<router-link
						:to="{ name: 'Board', params: { id: board.id } }"
						class="div text-nodec"
					>
						<div class="card" style="margin: 1em; min-width: 250px">
							<div v-if="user && board.public" class="ribbon right blue">
								<span>Public</span>
							</div>
							<div class="block">
								<div style="margin-bottom: 0.3em">
									<span class="title">{{ board.title }}</span>
								</div>
								<div class="body">
									<div>
										<span v-if="board.description" class="text-muted">{{
											board.description
										}}</span>
										<span
											v-else
											class="text-muted text-italic"
											style="font-size: 0.8em"
											>no description</span
										>
									</div>
									<div
										class="button primary mt-2"
										@click.prevent.stop="showDialog(board)"
									>
										Edit
									</div>
								</div>
							</div>
							<div class="block">
								<small class="text-muted"
									>Modified at
									{{ dateToAgo(board.updatedAt || board.createdAt) }}</small
								>
							</div>
						</div>
					</router-link>
				</div>
			</div>
		</div>

		<div
			class="w-40 h-10 bg-primary text-3xl ml-5 text-center rounded-md text-black"
			@click="changeA"
		>
			{{ arr[0].name }}
		</div>
		<div
			class="w-40 h-10 bg-orange-400 text-3xl ml-5 text-center rounded-md text-black"
			@click="$toast.warning({ title: 'Hello' })"
		>
			Hello
		</div>
		<div
			class="w-40 h-10 bg-red-600 text-3xl ml-5 text-center rounded-md text-black"
			@click="$toast.error({ title: 'Hello' })"
		>
			Hello
		</div>
		<div
			class="w-40 h-10 bg-green-400 text-3xl ml-5 text-center rounded-md text-black"
			@click="$toast.success({ title: 'Hello' })"
		>
			Hello
		</div>

		<button class="new-board button fab large primary icon" @click="showDialog()">
			<i class="fa fa-plus"></i>Primary
		</button>

		<edit-board-dialog ref="editDialog" />
	</div>
</template>

<script>
import Logo from "./account/partials/Logo.vue";
import { mapState } from "vuex";
import dateFormatter from "../mixins/dateFormatter";
import EditBoardDialog from "../components/EditBoardDialog.vue";

export default {
	components: {
		Logo,
		EditBoardDialog
	},
	mixins: [dateFormatter],

	computed: {
		...mapState(["boards", "user"])
	},

	methods: {
		showDialog(board) {
			this.$refs.editDialog.show({ board });
		}
	}
};
</script>

<style lang="scss" scoped>
.new-board {
	position: fixed;
	bottom: 1em;
	right: 1em;
	z-index: 1;
}
</style>
