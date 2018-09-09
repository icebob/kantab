<template>
	<div class="wrapper">
		<slot />
	</div>
</template>

<script>
export default {
	props: [
		"innerClass"
	]
};
</script>


<style lang="scss" scoped>
@import "../../../styles/variables";
.wrapper {
	display: flex;
    align-items: center;
    justify-content: center;

	width: 100%;
	height: 100%;
}
</style>
