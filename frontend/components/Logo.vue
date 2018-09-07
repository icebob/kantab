<template>
	<h3>
		<span>Kan</span><span>Tab</span>
	</h3>
</template>

<style lang="scss" scoped>
@import "../styles/variables";

h3 {
	margin: 0 auto;
	text-align: center;
	font-size: 2em;
	font-weight: 700;
	color: White;
	text-shadow: 0px 0px 20px rgba(0,0,0, 0.4);

	font-family: "Roboto Condensed";

	span:first-child {
		color: $selected;
		//font-size: 1.1em;
	}
}

</style>
