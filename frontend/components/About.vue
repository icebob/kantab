<template>
  <div class="about">
    <h1>This is an about page</h1>
	<template v-if="user">
		<img :src="user.avatar" />
		<pre><code>{{ user }}</code></pre>
		<social-links />
		<template v-if="!user.totp || !user.totp.enabled">
			<button class="button secondary" @click="enable2fa">Enable Two-Factor Authentication</button>
			<template v-if="otpauthURL">
				<br/>
				<img :src="otpauthURL" />
				<br/>
				<input v-model="otpUserToken" @keyup.enter.prevent="verify2FaToken" />
			</template>
		</template>
		<template v-else>
			<button class="button" @click="disable2fa">Disable Two-Factor Authentication</button>
		</template>
	</template>
	<p v-else>No logged in user</p>
  </div>
</template>

<script>
import SocialLinks from "./account/partials/SocialLinks";
import { mapState } from "vuex";
import qrcode from "yaqrcode";

export default {
	components: {
		SocialLinks
	},

	computed: {
		...mapState([
			"user"
		])
	},

	data() {
		return {
			otpauthURL: null,
			otpUserToken: ""
		};
	},

	methods: {
		async enable2fa() {
			const res = await this.$authenticator.enable2FA();
			console.log(res);

			this.otpauthURL = qrcode(res.otpauthURL, { size: 200 });
		},

		async disable2fa() {
			const res = await this.$authenticator.disable2FA();
			console.log(res);
		},

		async verify2FaToken() {
			const res = await this.$authenticator.finalize2FA(this.otpUserToken);
			console.log(res);
		}
	}
};
</script>
