<template>
	<div class="about">
		<h1>This is an about page</h1>
		<template v-if="user">
			<img :src="user.avatar" />
			<pre><code>{{ user }}</code></pre>
			<social-links />
			<template v-if="!user.totp || !user.totp.enabled">
				<button class="button secondary" @click="enable2FA">
					Enable Two-Factor Authentication
				</button>
				<template v-if="otpauthURL">
					<div>
						<p>Two-factor authentication is currently disabled.</p>
						<p>
							If you enable two-factor authentication following instructions below,
							you will be asked to provide an extra verification code next time you
							login.
						</p>
						<ol>
							<li>
								Install an authenticator app on your mobile device if you don't
								already have one.
								<a
									href="https://support.google.com/accounts/answer/1066447"
									target="_blank"
									>Need an authenticator app?</a
								>
							</li>
							<li>
								Scan QR code below or enter key manually using the authenticator
								application (or tap it in mobile browser)
								<br />
								<a :href="otpauthURL">
									<img :src="otpauthImage" />
								</a>
								<br />
								QR code key: <code>{{ otpSecret }}</code>
							</li>
							<li>
								Please write down or print a copy of the 16-digit secret code and
								put it in a safe place. If your phone gets lost, stolen or erased,
								you will need this code to link your account to a new authenticator
								app install once again
							</li>
							<li>
								Type the 6-digit code from authenticator application to verify your
								configuration:
								<br />
								<div class="form-group">
									<input
										v-model="otpUserToken"
										class="form-control"
										@keyup.enter.prevent="finalize2FA"
									/>
									<button class="button primary" @click="finalize2FA">
										Activate
									</button>
								</div>
							</li>
						</ol>
					</div>
				</template>
			</template>
			<template v-else>
				<button class="button" @click="disabling = true">
					Disable Two-Factor Authentication
				</button>
				<template v-if="disabling">
					<div>
						<p>Two-factor authentication is currently ENABLED.</p>
						<p>
							To disable it, type the 6-digit code from authenticator application to
							verify your configuration: <br />
						</p>

						<div class="form-group">
							<input
								v-model="otpUserToken"
								class="form-control"
								@keyup.enter.prevent="disable2FA"
							/>
							<button class="button primary" @click="disable2FA">Deactivate</button>
						</div>
					</div>
				</template>
			</template>
		</template>
		<p v-else>No logged in user</p>
	</div>
</template>

<script>
import SocialLinks from "../components/account/partials/SocialLinks.vue";
import { mapState, mapActions } from "vuex";
import qrcode from "yaqrcode";

export default {
	components: {
		SocialLinks
	},

	data() {
		return {
			otpauthURL: null,
			otpUserToken: "",
			disabling: false
		};
	},

	computed: {
		...mapState(["user"])
	},

	methods: {
		...mapActions(["getMe"]),

		async enable2FA() {
			try {
				const res = await this.$authenticator.enable2FA();
				this.otpauthURL = res.otpauthURL;
				this.otpSecret = res.secret;
				this.otpauthImage = qrcode(res.otpauthURL, { size: 200 });
			} catch (err) {
				this.$swal("Error!", err.message, "error");
			}
		},

		async disable2FA() {
			if (!this.otpUserToken) return;

			try {
				await this.$authenticator.disable2FA(this.otpUserToken);
				await this.getMe();
				this.$swal("Done!", "Two-factor authentication is disabled!", "success");
				this.disabling = false;
			} catch (err) {
				this.$swal("Error!", err.message, "error");
			}
		},

		async finalize2FA() {
			if (!this.otpUserToken) return;

			try {
				await this.$authenticator.finalize2FA(this.otpUserToken);
				await this.getMe();

				this.otpauthURL = null;
				this.otpUserToken = "";

				this.$swal("Done!", "Two-factor authentication is enabled!", "success");
			} catch (err) {
				this.$swal("Error!", err.message, "error");
			}
		}
	}
};
</script>
