<template>
	<div class="absolute w-full h-full left-0 top-0 right-0 bottom-0">
		<div class="h-full flex justify-center items-center">
			<div class="w-64 text-center">
				<logo class="justify-center" />

				<router-view />
			</div>
		</div>
	</div>
</template>

<script>
import { mapState } from "pinia";
import { authStore } from "../store/authStore";

import Logo from "../components/Logo.vue";

export default {
	components: {
		Logo
	},

	computed: {
		...mapState(authStore, ["user"])
	}
};
</script>
