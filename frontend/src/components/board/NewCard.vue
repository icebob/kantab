<template>
	<div
		class="my-1 p-2 flex flex-col gap-y-2 border border-neutral-700 bg-card shadow rounded-md transition-transform"
	>
		<div class="flex">
			<h6 class="flex-1 font-title text-primary">Create new card</h6>
			<button class="button small flat" @click="cancel"><i class="fa fa-times"></i></button>
		</div>
		<div class="form-element">
			<textarea
				ref="textarea"
				v-model="title"
				class="form-input"
				placeholder="What is the task?"
				@keydown.enter.stop.prevent="create()"
				@keydown.esc.stop.prevent="cancel"
			></textarea>
		</div>
		<div class="flex">
			<div><i class="fa fa-tags mx-2 text-muted"></i></div>
			<div class="flex-1 flex gap-2 flex-wrap">
				<div class="bg-primary rounded px-2 py-0.5 text-xs text-black text-shadow-sm">
					Frontend
					<i class="ml-1 fa fa-times cursor-pointer"></i>
				</div>
				<!-- <div class="bg-negative rounded px-2 py-0.5 text-xs text-white text-shadow-sm">
					<i class="fa fa-exclamation-circle"></i>
					High priority
					<i class="ml-1 fa fa-times cursor-pointer"></i>
				</div> -->
				<div
					class="border border-neutral-500 rounded-full px-2 py-0.5 text-xs text-neutral-500 cursor-pointer hover:border-neutral-400 hover:text-neutral-400"
				>
					<i class="fa fa-plus text-xxs"></i>
				</div>
			</div>
		</div>
		<hr class="border-t border-neutral-600" />
		<div class="flex items-center">
			<div><i class="fa fa-user-plus mx-2 text-muted"></i></div>
			<div class="flex-1 flex items-center gap-2 flex-wrap">
				<div class="flex">
					<img
						class="h-8 w-8 rounded-full border-2 border-panel object-cover"
						src="https://faces-img.xcdn.link/image-lorem-face-1128.jpg"
						alt=""
					/>
					<img
						class="h-8 w-8 rounded-full border-2 border-panel object-cover"
						src="https://faces-img.xcdn.link/image-lorem-face-5026.jpg"
						alt=""
					/>
				</div>
				<div
					class="w-7 h-7 border border-neutral-500 rounded-full text-neutral-500 cursor-pointer hover:border-neutral-400 hover:text-neutral-400 flex justify-center items-center"
				>
					<i class="fa fa-plus text-xs"></i>
				</div>
			</div>
		</div>
		<div class="mt-2 text-center">
			<button class="button primary w-full" :disabled="!title" @click="create">Create</button>
		</div>
	</div>
</template>

<script>
import { mapActions } from "pinia";
import { mainStore } from "../../store/store";

export default {
	props: {
		list: { type: Object, required: true },
		positionType: { type: String, default: "top" }
	},

	emits: ["cancel"],

	data() {
		return {
			title: ""
		};
	},

	mounted() {
		this.$nextTick(() => {
			this.$refs.textarea?.focus();
		});
	},

	methods: {
		...mapActions(mainStore, ["createCard"]),

		async create() {
			if (this.title.trim() === "") {
				return this.cancel();
			}

			let position;
			if (this.positionType == "top") {
				position = this.list.cards?.rows?.length ? this.list.cards.rows[0].position - 1 : 1;
			} else {
				position = this.list.cards?.rows?.length
					? this.list.cards.rows[this.list.cards.rows.length - 1].position + 1
					: 1;
			}

			await this.createCard({
				list: this.list,
				input: {
					title: this.title,
					list: this.list.id,
					position
				}
			});

			this.title = "";
		},

		cancel() {
			this.$emit("cancel");
		}
	}
};
</script>
