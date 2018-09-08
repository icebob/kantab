<template>
  <div class="about">
    <h1>This is an about page</h1>
	<pre v-if="user"><code>{{ user }}</code></pre>
	<p v-else>No logged in user</p>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from "vuex";

export default {
	computed: {
		...mapState([
			"user"
		])
	}
};
</script>
