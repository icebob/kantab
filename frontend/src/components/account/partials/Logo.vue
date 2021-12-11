<template>
	<h3 @click="$router.push('/')"><span>Kan</span><span>Tab</span></h3>
</template>

<style lang="scss" scoped>
@import "../../../styles/_variables.scss";

h3 {
	margin: 0;
	text-align: center;
	font-size: 2em;
	font-weight: 700;
	color: $textColor2;
	text-shadow: 0px 0px 20px rgba(0, 0, 0, 0.4);

	font-family: $fontFamilyHeader;

	span:first-child {
		color: $primary;
	}
}
</style>
