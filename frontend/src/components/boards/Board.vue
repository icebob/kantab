<template>
	<div>
		<h3>Board details</h3>
		<div v-if="board">
			<div class="card dialog">
				<div class="block">
					<div class="content forms">
						<fieldset>
							<legend>{{ board.title }}</legend>
							<div class="form-group">
								<div>{{ board.description }}</div>
							</div>
						</fieldset>
					</div>
				</div>
				<div class="block">
					<button class="button success">Save</button>
				</div>
				<div class="block">
					<small class="text-muted">Last modified XXX</small>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
import { mapState, mapActions } from "vuex";

export default {
	props: {
		id: {
			required: true,
			type: String
		}
	},
	data() {
		return {
			boardCopy: { ...this.board }
		};
	},
	computed: {
		...mapState(["board"])
	},
	methods: {
		...mapActions(["getBoard"])
	},
	async created() {
		console.log("ID", this.id);
		await this.getBoard(this.id);
	},
	watch: {
		async id() {
			console.log("ID", this.id);
			await this.getBoard(this.id);
		}
	}
};
</script>
