<template>
	<div class="about">
		<h2 class="mb-8 ml-4">This is an about page</h2>
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
												user.totp && user.totp.enabled
													? 'fa fa-check'
													: 'fa fa-times'
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
			<div class="pl-3">
				<button
					v-if="!user.totp || !user.totp.enabled"
					class="button secondary"
					@click="show2FADialog"
				>
					Enable Two-Factor Authentication
				</button>
				<button v-else class="button secondary" @click="show2FADialog">
					Disable Two-Factor Authentication
				</button>
			</div>
		</template>
		<p v-else>No logged in user</p>
		<e2-f-a-dialog ref="E2FADialog" />
	</div>
</template>

<script>
import { mapState } from "pinia";
import { authStore } from "../store/authStore";

import SocialLinks from "../components/SocialLinks.vue";
import E2FADialog from "../components/E2FADialog.vue";

export default {
	components: {
		SocialLinks,
		E2FADialog
	},

	data() {
		return {
			otpauthURL: null,
			otpUserToken: "",
			disabling: false
		};
	},

	computed: {
		...mapState(authStore, ["user"])
	},

	methods: {
		async show2FADialog() {
			if (this.user.totp?.enabled) {
				this.$refs.E2FADialog?.show({ disabling: true });
			} else {
				this.$refs.E2FADialog?.show({ disabling: false });
			}
		}
	}
};
</script>
