<template>
<page-content>
	<page-center>
		<div class="auth-panel">
			<logo />
			<h4>404 - Page Not Found</h4>
			<h5>We looked practically everywhere but can't seem to find the page your're looking for.</h5>
			<button class="button large primary" @click="$router.push('/')">Take Me Away</button>
		</div>
	</page-center>
</page-content>

</template>

<script>
import AuthPanel from "./mixins/AuthPanel";

export default {
	mixins: [
		AuthPanel
	]
};
</script>
