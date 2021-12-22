<template>
	<router-view />
</template>

<script>
import { mapState, mapActions } from "vuex";

export default {
	computed: {
		...mapState(["user"])
	},

	created() {
		this.init();
	},

	methods: {
		...mapActions(["init"])
	}
};
</script>
