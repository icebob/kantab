<template>
	<k-dialog v-model="visible" :title="pageTitle">
		<template #default>
			<div v-if="showAnswers" class="form-element">
				<label v-if="disabling" class="block mb-4"> Are you sure to disable 2FA?</label>
				<label v-else class="block mb-4"> Are you sure to enable 2FA?</label>
				<div class="flex justify-around items-center">
					<button v-if="disabling" class="button secondary" @click="doDisable2FA">
						Yes
					</button>
					<button v-else class="button secondary" @click="doEnable2FA">Yes</button>

					<button class="button negative" @click="close">Cancel</button>
				</div>
			</div>
			<div class="mt-3 form-element">
				<template v-if="otpauthURL">
					<div class="space-x-2">
						<p class="px-2 pb-2">Two-factor authentication is currently disabled.</p>
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
							<li class="my-2">
								Scan QR code below or enter key manually using the authenticator
								application (or tap it in mobile browser)

								<a :href="otpauthURL">
									<img class="mx-auto" :src="otpauthImage" />
								</a>

								<span>
									QR code key: <code>{{ otpSecret }}</code></span
								>
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

								<div class="form-group">
									<input
										v-model="otpUserToken"
										class="form-control my-3"
										@keyup.enter.prevent="doFinalize2FA"
									/>
									<button class="button primary my-3" @click="doFinalize2FA">
										Activate
									</button>
								</div>
							</li>
						</ol>
					</div>
				</template>
				<template v-else-if="disabling && !showAnswers">
					<div>
						<p>Two-factor authentication is currently ENABLED.</p>
						<p class="my-3">
							To disable it, type the 6-digit code from authenticator application to
							verify your configuration: <br />
						</p>

						<div class="form-group">
							<input
								v-model="otpUserToken"
								class="form-control"
								@keyup.enter.prevent="doDisable2FA"
							/>
							<button class="button primary my-3" @click="doDisable2FA">
								Deactivate
							</button>
						</div>
					</div>
				</template>
			</div>
		</template>
	</k-dialog>
</template>
<script>
import { mapActions, mapState } from "pinia";
import { authStore } from "../store/authStore";
import KDialog from "./Dialog.vue";
import qrcode from "yaqrcode";
export default {
	components: {
		KDialog
	},
	data() {
		return {
			visible: false,
			pageTitle: "",
			otpauthURL: null,
			otpUserToken: "",
			disabling: false,
			showAnswers: true
		};
	},
	computed: {
		...mapState(authStore, ["user"])
	},
	methods: {
		...mapActions(authStore, ["getMe", "enable2FA", "disable2FA", "finalize2FA"]),

		show({ disabling }) {
			this.disabling = disabling;
			if (disabling == false) {
				this.pageTitle = "Enabling 2FA";
			} else {
				this.pageTitle = "Disabling 2FA";
			}
			this.visible = true;
		},

		close() {
			this.visible = false;
		},

		async save() {
			this.close();
		},

		async doEnable2FA() {
			try {
				this.showAnswers = false;
				const res = await this.enable2FA();
				this.otpauthURL = res.otpauthURL;
				this.otpSecret = res.secret;
				this.otpauthImage = qrcode(res.otpauthURL, { size: 200 });
			} catch (err) {
				this.$swal("Error!", err.message, "error");
			}
		},

		async doDisable2FA() {
			this.showAnswers = false;
			if (!this.otpUserToken) return;
			try {
				await this.disable2FA({ token: this.otpUserToken });
				await this.getMe();
				this.$swal("Done!", "Two-factor authentication is disabled!", "success");
				this.disabling = false;
				this.close();
			} catch (err) {
				this.$swal("Error!", err.message, "error");
			}
		},

		async doFinalize2FA() {
			if (!this.otpUserToken) return;

			try {
				await this.finalize2FA({ token: this.otpUserToken });
				await this.getMe();

				this.otpauthURL = null;
				this.otpUserToken = "";
				this.close();
				this.$swal("Done!", "Two-factor authentication is enabled!", "success");
			} catch (err) {
				this.$swal("Error!", err.message, "error");
			}
		}
	}
};
</script>
