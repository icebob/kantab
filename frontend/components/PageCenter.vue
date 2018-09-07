<template>
	<div class="wrap-outer">
		<div class="wrap-inner">
			<slot />
		</div>
	</div>
</template>

<style lang="scss" scoped>
@import "../styles/variables";
.wrap-outer {
	display: flex;
    align-items: center;
    justify-content: center;

	width: 100%;
	height: 100%;
}
</style>
