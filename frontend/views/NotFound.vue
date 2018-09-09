<template>
<page-content>
	<page-center>
		<div class="auth-panel">
			<logo />
			<h4>404 - Page Not Found</h4>
			<h5>We looked practically everywhere but can't seem to find the page your're looking for.</h5>
			<button @click="$router.push('/')">Take Me Away</button>
		</div>
	</page-center>
</page-content>

</template>

<script>
import Logo from "../components/Logo";
import PageCenter from "../components/PageCenter";
import PageContent from "../components/PageContent";

export default {
	components: {
		Logo,
		PageContent,
		PageCenter
	},
};
</script>

<style lang="scss" scoped>
@import "../styles/variables";
@import "../styles/auth";

</style>
