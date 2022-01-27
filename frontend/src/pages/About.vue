<template>
	<div class="about">
		<h2 class="mb-8">This is an about page</h2>
		<template v-if="user">
			<div class="flex mb-4">
				<div class="w-1/3">
					<img :src="user.avatar" class="mx-auto object-cover w-21 h-21 rounded-full" />
				</div>
				<div class="w-2/3">
					<!-- 			//<pre><code>{{ user }}</code></pre> -->
					<div class="overflow-hidden">
						<table class="min-w-full divide-y divide-gray-200">
							<tbody>
								<tr>
									<td
										class="px-6 py-3 text-left text-lg font-medium text-gray-300 uppercase tracking-wider"
									>
										ID
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-lg">
										{{ user.id }}
									</td>
								</tr>
								<tr>
									<td
										class="px-6 py-3 text-left text-lg font-medium text-gray-300 uppercase tracking-wider"
									>
										Username
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-lg">
										{{ user.username }}
									</td>
								</tr>
								<tr>
									<td
										class="px-6 py-3 text-left text-lg font-medium text-gray-300 uppercase tracking-wider"
									>
										Full name
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-lg">
										{{ user.fullName }}
									</td>
								</tr>
								<tr>
									<td
										class="px-6 py-3 text-left text-lg font-medium text-gray-300 uppercase tracking-wider"
									>
										Avatar
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-lg">
										{{ user.avatar }}
									</td>
								</tr>
								<tr>
									<td
										class="px-6 py-3 text-left text-lg font-medium text-gray-300 uppercase tracking-wider"
									>
										Verified
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-lg">
										<i
											:class="user.verified ? 'fa fa-check' : 'fa fa-times'"
										></i>
									</td>
								</tr>
								<tr>
									<td
										class="px-6 py-3 text-left text-lg font-medium text-gray-300 uppercase tracking-wider"
									>
										Passwordless
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-lg">
										<i
											:class="
												user.passwordless ? 'fa fa-check' : 'fa fa-times'
											"
										></i>
									</td>
								</tr>
								<tr>
									<td
										class="px-6 py-3 text-left text-lg font-medium text-gray-300 uppercase tracking-wider"
									>
										Two factor auth
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-lg">
										<i
											:class="
												user.totp.enabled ? 'fa fa-check' : 'fa fa-times'
											"
										></i>
									</td>
								</tr>
								<tr>
									<td
										class="px-6 py-3 text-left text-lg font-medium text-gray-300 uppercase tracking-wider"
									>
										Socials
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-lg">
										<span class="pr-3">
											Github
											<i
												:class="
													user.socialLinks.github
														? 'fa fa-check'
														: 'fa fa-times'
												"
											></i>
										</span>
										<span class="pr-3">
											Google
											<i
												:class="
													user.socialLinks.google
														? 'fa fa-check'
														: 'fa fa-times'
												"
											></i>
										</span>
										<span class="pr-3">
											Facebook
											<i
												:class="
													user.socialLinks.facebook
														? 'fa fa-check'
														: 'fa fa-times'
												"
											></i>
										</span>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
			<social-links />
			<template v-if="!user.totp || !user.totp.enabled">
				<button class="button secondary" @click="doEnable2FA">
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
										@keyup.enter.prevent="doFinalize2FA"
									/>
									<button class="button primary" @click="doFinalize2FA">
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
								@keyup.enter.prevent="doDisable2FA"
							/>
							<button class="button primary" @click="doDisable2FA">Deactivate</button>
						</div>
					</div>
				</template>
			</template>
		</template>
		<p v-else>No logged in user</p>
	</div>
</template>

<script>
import SocialLinks from "../components/SocialLinks.vue";
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
		...mapState("auth", ["user"])
	},

	methods: {
		...mapActions("auth", ["getMe", "enable2FA", "disable2FA", "finalize2FA"]),

		async doEnable2FA() {
			try {
				const res = await this.enable2FA();
				this.otpauthURL = res.otpauthURL;
				this.otpSecret = res.secret;
				this.otpauthImage = qrcode(res.otpauthURL, { size: 200 });
			} catch (err) {
				this.$swal("Error!", err.message, "error");
			}
		},

		async doDisable2FA() {
			if (!this.otpUserToken) return;

			try {
				await this.disable2FA({ token: this.otpUserToken });
				await this.getMe();
				this.$swal("Done!", "Two-factor authentication is disabled!", "success");
				this.disabling = false;
			} catch (err) {
				this.$swal("Error!", err.message, "error");
			}
		},

		async doFinalize2FA() {
			if (!this.otpUserToken) return;

			try {
				await this.finalize2FA({ token: this.otpUserToken });
				//await this.getMe();

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
