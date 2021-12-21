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
import Colors from "../components/style-guide/Colors.vue";
import Typo from "../components/style-guide/Typo.vue";
import Buttons from "../components/style-guide/Buttons.vue";
import Forms from "../components/style-guide/Forms.vue";
import Alerts from "../components/style-guide/Alerts.vue";
import Tables from "../components/style-guide/Tables.vue";
import Tags from "../components/style-guide/Tags.vue";
import Progressbars from "../components/style-guide/Progressbars.vue";
import Panels from "../components/style-guide/Panels.vue";
import Media from "../components/style-guide/Media.vue";

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
