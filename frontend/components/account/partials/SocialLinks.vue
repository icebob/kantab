<template>
	<div>
		<template v-if="providers.length > 0">
			<h4>Link your social accounts</h4>
			<div class="social-buttons">
				<template>
					<a v-if="!isLinked('google')" href="/auth/google" class="button primary">Link to Google</a>
					<button v-else @click="unlinkSocial('google')" class="button">Unlink from Google</button>
				</template>
				<template>
					<a v-if="!isLinked('facebook')" href="/auth/facebook" class="button primary">Link to Facebook</a>
					<button v-else @click="unlinkSocial('facebook')" class="button">Unlink from Facebook</button>
				</template>
				<template>
					<a v-if="!isLinked('github')" href="/auth/github" class="button primary">Link to Github</a>
					<button v-else @click="unlinkSocial('github')" class="button">Unlink from Github</button>
				</template>
			</div>
		</template>
	</div>
</template>

<script>
import { mapState, mapActions } from "vuex";

export default {
	computed: {
		...mapState([
			"providers",
			"user"
		])
	},

	methods: {
		...mapActions([
			"unlinkSocial"
		]),

		isSupported(provider) {
			return !!this.providers.find(o => o == provider);
		},

		isLinked(provider) {
			return !!this.user.socialLinks[provider];
		}
	}
};
</script>


<style lang="scss" scoped>

.social-buttons {
	margin: 1em 0;
	text-align: center;

	.button {
		margin: 0 1em;

	}
}
</style>
