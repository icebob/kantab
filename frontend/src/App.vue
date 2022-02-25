<template>
	<router-view />
</template>

<script>
//import { mapState, mapActions } from "vuex";

import { mapState, mapActions } from "pinia";
import { authStore } from "./store/authStore";
import { mainStore } from "./store/store";
export default {
	computed: {
		...mapState(authStore, ["user"])
	},

	created() {
		this.init();
	},

	methods: {
		...mapActions(mainStore, ["init"])
	}
};
</script>
