<template>
	<div class="m-4 w-64 border border-neutral-500 rounded-md bg-panel shadow-panel relative">
		<div v-if="ribbon" class="ribbon right blue">
			<span>{{ ribbon }}</span>
		</div>
		<div class="px-5 pt-5">
			<div>
				<span class="font-title text-2xl font-light">{{ title }}</span>
			</div>
			<div class="text-sm text-muted">
				<span v-if="description">{{ description }}</span
				><span v-else class="italic">{{ $t("noDescription") }}</span>
			</div>
		</div>
		<div v-if="footer" class="p-5">
			<small class="text-xs text-neutral-500">{{ footer }}</small>
		</div>
	</div>
</template>

<script>
export default {
	props: {
		title: { type: String, default: null },
		description: { type: String, default: null },
		footer: { type: String, default: null },
		ribbon: { type: String, default: null },
		ribbonDirection: { type: String, default: "right" },
		ribbonColor: { type: String, default: "blue" }
	}
};
</script>
