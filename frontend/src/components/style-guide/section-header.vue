<template>
	<div>
		<h2>
			<span class="number">{{ number }}.</span> <span class="text">{{ caption }}</span>
		</h2>
	</div>
</template>

<script>
export default {
	props: ["number", "caption"]
};
</script>

<style lang="scss" scoped>
@import "../../styles/variables";

h2 {
	font-size: 1.5rem;
	margin-bottom: 20px;
	padding: 8px 10px;

	background-color: rgba(darken($backgroundColor, 10%), 0.6);
	border: 1px solid darken($backgroundColor, 8%);
	border-radius: 8px;

	.number {
		color: #888;
	}

	.text {
		margin-left: 4px;
		font-weight: 300;
		text-transform: uppercase;
	}

	clear: both;
}
</style>
