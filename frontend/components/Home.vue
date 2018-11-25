<template>
	<dir>
		<Logo/>
		<h4>Home</h4>
		<button @click="getBoards">Get boards</button>
		<pre v-if="boards"><code>{{ boards }}</code></pre>
	</dir>
</template>

<script>
import Logo from "./account/partials/Logo";

export default {
	components: {
		Logo
	},

	data() {
		return {
			boards: null
		};
	},

	methods: {
		getBoards() {
			this.$socket.emit("call", "v1.boards.list", { page: 1, pageSize: 5 }, (err, res) => {
				if (err)
					return alert(err.message);

				this.boards = res;
			});
		}
	}
};
</script>
