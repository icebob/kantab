<template>
	<div class="page">
		<h2>Style guide</h2>

		<colors />
		<typo />
		<buttons />
		<forms />
		<alerts />
		<tables />
		<tags />
		<progressbars />
		<panels />
		<media />
	</div>
</template>

<script>
import Colors from "./Colors.vue";
import Typo from "./Typo.vue";
import Buttons from "./Buttons.vue";
import Forms from "./Forms.vue";
import Alerts from "./Alerts.vue";
import Tables from "./Tables.vue";
import Tags from "./Tags.vue";
import Progressbars from "./Progressbars.vue";
import Panels from "./Panels.vue";
import Media from "./Media.vue";

export default {
	components: {
		Colors,
		Typo,
		Buttons,
		Forms,
		Alerts,
		Tables,
		Tags,
		Progressbars,
		Panels,
		Media
	}
};
</script>

<style lang="scss" scoped>
.page {
	padding: 1.5em;
}

section {
	&:not(:last-child) {
		margin-bottom: 40px;
	}
}
</style>
