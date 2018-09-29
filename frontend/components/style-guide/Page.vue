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
import Colors from "./Colors";
import Typo from "./Typo";
import Buttons from "./Buttons";
import Forms from "./Forms";
import Alerts from "./Alerts";
import Tables from "./Tables";
import Tags from "./Tags";
import Progressbars from "./Progressbars";
import Panels from "./Panels";
import Media from "./Media";

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
		Media,
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
