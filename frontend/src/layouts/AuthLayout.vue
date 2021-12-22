<template>
	<div class="absolute w-full h-full left-0 top-0 right-0 bottom-0">
		<div class="h-full flex justify-center items-center">
			<div class="w-64 text-center">
				<logo />

				<router-view />
			</div>
		</div>
	</div>
</template>

<script>
import { mapState } from "vuex";
import Logo from "../components/Logo.vue";

export default {
	components: {
		Logo
	},

	computed: {
		...mapState(["user"])
	}
};
</script>
