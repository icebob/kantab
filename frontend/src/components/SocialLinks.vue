<template>
	<div class="mb-8 ml-4">
		<template v-if="providers && providers.length > 0">
			<h4>Link your social accounts</h4>
			<div class="social-buttons">
				<div>
					<a v-if="!isLinked('google')" href="/auth/google" class="button primary"
						>Link to Google</a
					>
					<button v-else class="button" @click="unlinkSocial({ provider: 'google' })">
						Unlink from Google
					</button>
				</div>
				<div>
					<a v-if="!isLinked('facebook')" href="/auth/facebook" class="button primary"
						>Link to Facebook</a
					>
					<button v-else class="button" @click="unlinkSocial({ provider: 'facebook' })">
						Unlink from Facebook
					</button>
				</div>
				<div>
					<a v-if="!isLinked('github')" href="/auth/github" class="button primary"
						>Link to Github</a
					>
					<button v-else class="button" @click="unlinkSocial({ provider: 'github' })">
						Unlink from Github
					</button>
				</div>
			</div>
		</template>
	</div>
</template>

<script>
import { mapState, mapActions } from "pinia";
import { authStore } from "../store/authStore";

export default {
	computed: {
		...mapState(authStore, ["providers", "user"])
	},

	methods: {
		...mapActions(authStore, ["unlinkSocial"]),

		isSupported(provider) {
			return !!this.providers.find(o => o == provider);
		},

		isLinked(provider) {
			return !!this.user?.socialLinks?.[provider];
		}
	}
};
</script>

<style lang="scss" scoped>
.social-buttons {
	display: flex;
	margin: 1em 0;
	text-align: center;

	.button {
		margin: 0 1em;
	}
}
</style>
