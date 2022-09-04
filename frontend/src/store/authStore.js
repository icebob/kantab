import { defineStore } from "pinia";
import { mainStore } from "./store";
import Cookie from "js-cookie";
const COOKIE_TOKEN_NAME = "jwt-token";
const COOKIE_EXPIRED_DAYS = 90;

import router from "../router";
import { graphqlClient } from "../graphqlClient";
import { gql } from "graphql-request";

import { defaultsDeep, isFunction } from "lodash";

export const authStore = defineStore({
	// id is required so that Pinia can connect the store to the devtools
	id: "authStore",

	// --- STATE ---
	state: () => ({
		// Logged in user entity
		user: null,
		// Social login providers
		providers: []
	}),
	getters: {},

	// --- ACTIONS ---
	actions: {
		async getMe() {
			try {
				const query = gql`
					query {
						me {
							id
							username
							fullName
							avatar
							verified
							passwordless
							totp {
								enabled
							}
							socialLinks {
								github
								google
								facebook
							}
						}
					}
				`;
				const data = await graphqlClient.request(query);
				this.user = data.me;

				/*if (process.env.NODE_ENV == "production") {
					Raven.setUserContext(user);
					LogRocket.identify(user._id, user);
				}*/

				return data.me;
			} catch (err) {
				console.log("Unable to get current user", err);
			}
			return null;
		},

		/**
		 * Register a new account.

		 * @param {Store} store
		 * @param {Object} params
		 */
		async register(params) {
			const query = gql`
				mutation register(
					$username: String!
					$fullName: String!
					$email: String!
					$password: String
				) {
					register(
						username: $username
						fullName: $fullName
						email: $email
						password: $password
					) {
						id
						username
						fullName
						avatar
						verified
						passwordless
					}
				}
			`;

			const variables = {
				...params,
				password: params.password || null
			};
			const data = await graphqlClient.request(query, variables);
			if (data.register.verified) {
				const user = await this.applyToken(data.login.token);

				const redirect = router?.currentRoute?.value?.query?.redirect;
				router.push(redirect ? redirect : { name: "home" });

				return user;
			}

			return null;
		},
		async login({ email, password, token }) {
			const query = gql`
				mutation login($email: String!, $password: String, $token: String) {
					login(email: $email, password: $password, token: $token) {
						token
						passwordless
						email
					}
				}
			`;
			const variables = { email, password, token };
			const data = await graphqlClient.request(query, variables);

			if (data.login.token) {
				console.log("data login token", data.login.token);
				await this.applyToken(data.login.token);
				await mainStore().getBoards();

				const redirect = router?.currentRoute?.value?.query?.redirect;
				router.push(redirect ? redirect : { name: "home" });
			}

			return data.login;
		},

		/**
		 * Apply a received login token.
		 *
		 * @param {Store} store
		 * @param {String} token
		 */
		async applyToken(token) {
			Cookie.set(COOKIE_TOKEN_NAME, token, { expires: COOKIE_EXPIRED_DAYS });
			return await this.getMe();
		},

		async passwordless({ token }) {
			const query = gql`
				mutation passwordlessLogin($token: String!) {
					passwordlessLogin(token: $token) {
						token
					}
				}
			`;
			const variables = { token };
			const data = await graphqlClient.request(query, variables);
			if (data.passwordlessLogin.token) {
				await this.applyToken(data.passwordlessLogin.token);
				await mainStore().getBoards();

				const redirect = router?.currentRoute?.value?.query?.redirect;
				router.push(redirect ? redirect : { name: "home" });
			}

			return data.passwordlessLogin;
		},

		/**
		 * Logging out.

		 * @param {Store} store
		 */
		async logout(store) {
			//store.commit("LOGOUT");
			this.user = null;
			Cookie.remove(COOKIE_TOKEN_NAME);
			router.push({ name: "login" });
			//this.$socket.disconnect();
		},

		/**
		 * Forgot password
		 * @param {Store} store
		 * @param {String} email
		 */
		async forgotPassword({ email }) {
			const query = gql`
				mutation forgotPassword($email: String!) {
					forgotPassword(email: $email)
				}
			`;
			const variables = { email };
			await graphqlClient.request(query, variables);
		},

		/**
		 * Reset password.

		 * @param {Store} store
		 * @param {Object} param1
		 */
		async resetPassword({ token, password }) {
			const query = gql`
				mutation resetPassword($token: String!, $password: String!) {
					resetPassword(token: $token, password: $password) {
						token
					}
				}
			`;
			const variables = { token, password };
			const data = await graphqlClient.request(query, variables);

			if (data.resetPassword.token) {
				const user = await this.applyToken(data.resetPassword.token);
				await mainStore().getBoards();

				router.push({ name: "home" });

				return user;
			}
		},

		/**
		 * Verify account
		 * @param {Store} store
		 * @param {String} verifyToken
		 */
		async verifyAccount({ token }) {
			const query = gql`
				mutation accountVerify($token: String!) {
					accountVerify(token: $token) {
						token
					}
				}
			`;
			const variables = { token };
			const data = await graphqlClient.request(query, variables);
			if (data.accountVerify.token) {
				const user = await this.applyToken(data.accountVerify.token);
				await mainStore().getBoards();
				router.push({ name: "home" });

				return user;
			}
		},

		async finalize2FA({ token }) {
			const query = gql`
				mutation accountFinalize2FA($token: String) {
					accountFinalize2FA(token: $token)
				}
			`;
			const variables = { token };
			const data = await graphqlClient.request(query, variables);
			return data;
		},

		async disable2FA({ token }) {
			const query = gql`
				mutation accountDisable2FA($token: String!) {
					accountDisable2FA(token: $token)
				}
			`;
			const variables = { token };
			const data = await graphqlClient.request(query, variables);
			return data;
		},

		async getSupportedSocialAuthProviders() {
			try {
				const query = gql`
					query supportedSocialAuthProviders {
						supportedSocialAuthProviders
					}
				`;
				const data = await graphqlClient.request(query);
				this.providers = data.supportedSocialAuthProviders;
				return data.supportedSocialAuthProviders;
			} catch (err) {
				console.log("cant get auth", err);
			}
			return null;
		},

		async unlinkSocial({ id, provider }) {
			try {
				const query = gql`
					mutation accountUnlink($id: String, $provider: String!) {
						accountUnlink(id: $id, provider: $provider) {
							id
							username
							fullName
							avatar
							verified
							passwordless
							totp {
								enabled
							}
							socialLinks {
								github
								google
								facebook
							}
						}
					}
				`;

				const variables = { id, provider };
				const data = await graphqlClient.request(query, variables);
				//commit("SET_LOGGED_IN_USER", data.accountUnlink);
				this.user = data.accountUnlink;
				console.log("unlinkSocial: ", data.accountUnlink);
				return null;
			} catch (err) {
				console.log("unlinkSocial", err?.response?.errors?.[0]?.message);
			}
		},

		protectRouter() {
			// Authentication protection
			router.beforeEach(async (to, from, next) => {
				// First restricted page (try to authenticate with token)
				if (!from.name) {
					const token = Cookie.get(COOKIE_TOKEN_NAME);
					if (token) {
						await this.getMe();
					}
				}

				// check authenticated
				if (to.matched.some(route => route.meta.requiresAuth)) {
					if (this.user) {
						next();
					} else {
						next({
							name: "login",
							query: { redirect: to.fullPath }
						});
					}
				}

				// redirect if authenticated
				else if (to.matched.some(route => route.meta.redirectAuth)) {
					if (this.user) {
						next({
							name: to.meta.redirectAuth,
							query: to.query
						});
					} else {
						next();
					}
				}

				// no need authenticated
				else {
					next();
				}
			});

			// Authorization protection
			router.beforeEach(async (to, from, next) => {
				const authorized = to.matched.every(route => {
					if (isFunction(route.meta.authorize)) {
						return !!route.meta.authorize(to);
					}
					return true;
				});

				if (authorized) {
					next();
				} else {
					next(false);
				}
			});
		},

		async enable2FA() {
			const query = gql`
				mutation accountEnable2FA {
					accountEnable2FA {
						secret
						otpauthURL
					}
				}
			`;

			const data = await graphqlClient.request(query);
			return data.accountEnable2FA;
		}
	}
});
