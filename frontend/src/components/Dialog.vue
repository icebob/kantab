<template>
	<div>
		<transition name="fade">
			<div
				v-if="modelValue"
				class="fixed top-0 right-0 bottom-0 left-0 bg-black bg-opacity-50"
			></div>
		</transition>
		<transition name="scale">
			<div
				v-if="modelValue"
				role="dialog"
				class="fixed top-0 right-0 bottom-0 left-0 flex justify-center items-center"
				@click.self="close"
			>
				<div
					class="w-[400px] max-w-full border border-neutral-500 rounded-md bg-panel shadow-2xl"
				>
					<div class="px-5 pt-5">
						<div
							class="mb-3 font-title font-light text-xl uppercase pb-1 border-b-2 border-primary-600"
						>
							{{ title }}
						</div>
						<slot name="default" />

						<slot name="actions"> </slot>
					</div>
				</div>
			</div>
		</transition>
	</div>
</template>
<script>
export default {
	props: {
		title: { type: String, default: "Dialog" },
		modelValue: { type: Boolean, default: false }
	},

	emits: ["update:modelValue"],

	methods: {
		close() {
			this.$emit("update:modelValue", false);
		}
	}
};
</script>
