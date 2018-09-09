<template>
  <div class="about">
    <h1>This is an about page</h1>
	<template v-if="user">
		<img :src="user.avatar" />
		<pre><code>{{ user }}</code></pre>
	</template>
	<p v-else>No logged in user</p>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
	computed: {
		...mapState([
			"user"
		])
	}
};
</script>
