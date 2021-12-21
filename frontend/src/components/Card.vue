<template lang="pug">
.m-4.w-64.border.border-neutral-500.rounded-md.bg-panel.shadow-panel.relative
	.ribbon.right.blue(v-if="ribbon")
		span {{ ribbon }}

	.px-5.pt-5
		div
			span.font-title.text-2xl.font-light {{ title }}

		div.text-sm.text-muted
			span(v-if='description') {{ description }}
			span.italic(v-else='') no description

	.p-5(v-if="footer")
		small.text-xs.text-neutral-500 {{ footer }}
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
