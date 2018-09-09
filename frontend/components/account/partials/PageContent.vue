<template>
	<main>
		<slot />
	</main>
</template>

<style lang="scss" scoped>
@import "../../../styles/variables";

main {
	position: absolute;
	left: 0; right: 0; top: 0; bottom: 0;
	background-color: rgba(#000, 0.7);

	height: 100%;
	min-height: 100%;

	background-image: -webkit-radial-gradient(center center, $backgroundColor2, $backgroundColor);
}
</style>
