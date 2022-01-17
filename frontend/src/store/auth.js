"use strict";

import Cookie from "js-cookie";
const COOKIE_TOKEN_NAME = "jwt-token";
const COOKIE_EXPIRED_DAYS = 90;

import { Store } from "vuex"; // eslint-disable-line no-unused-vars

import router from "../router";
import { graphqlClient } from "../graphqlClient";
import { gql } from "graphql-request";

import { defaultsDeep, isFunction } from "lodash";
import axios from "axios";

export default {
	namespaced: true,

	// --- STATE ---
	state: {
		// Logged in user entity
		user: null,
		// Social login providers
		providers: []
	},

	// --- GETTERS ---
	getters: {},

	// --- ACTIONS ---
	actions: {
		async getMe({ commit }) {
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
							# socialLinks
						}
					}
				`;
				const data = await graphqlClient.request(query);
				commit("SET_LOGGED_IN_USER", data.me);

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
		async register({ state, dispatch }, params) {
			const res = await apolloClient.mutate({
				mutation: gql`
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
				`,
				variables: {
					...params,
					password: params.password || null
				}
			});

			if (res.data.register.verified) {
				const user = await this.applyToken(res.token);

				const { redirect } = state.route.query;
				router.push(redirect ? redirect : { name: "home" });

				return user;
			}

			return null;
		},

		/**
		 * Logging in
		 * @param {Store} store
		 * @param {Object} param1
		 */
		async login({ rootState, dispatch }, { email, password }) {
			const res = await apolloClient.mutate({
				mutation: gql`
					mutation login($email: String!, $password: String) {
						login(email: $email, password: $password) {
							token
							passwordless
							email
						}
					}
				`,
				variables: { email, password }
			});
			if (res.data.login.token) {
				await dispatch("applyToken", res.data.login.token);
				await dispatch("getBoards", null, { root: true });
				const { redirect } = rootState.route.query;
				router.push(redirect ? redirect : { name: "home" });
			}

			return res.data.login;
		},

		async passwordless({ dispatch, rootState }, { token }) {
			const res = await apolloClient.mutate({
				mutation: gql`
					mutation passwordlessLogin($token: String!) {
						passwordlessLogin(token: $token) {
							token
						}
					}
				`,
				variables: { token }
			});
			if (res.data.passwordlessLogin.token) {
				await dispatch("applyToken", res.data.passwordlessLogin.token);
				await dispatch("getBoards", null, { root: true });
				const { redirect } = rootState.route.query;
				router.push(redirect ? redirect : { name: "home" });
			}

			return res.data.passwordlessLogin;
		},

		/**
		 * Logging out.

		 * @param {Store} store
		 */
		async logout(store) {
			store.commit("LOGOUT");
			Cookie.remove(COOKIE_TOKEN_NAME);
			router.push({ name: "login" });
			//this.$socket.disconnect();
		},

		/**
		 * Forgot password
		 * @param {Store} store
		 * @param {String} email
		 */
		async forgotPassword(store, { email }) {
			await apolloClient.mutate({
				mutation: gql`
					mutation forgotPassword($email: String!) {
						forgotPassword(email: $email)
					}
				`,
				variables: { email }
			});
		},

		/**
		 * Reset password.

		 * @param {Store} store
		 * @param {Object} param1
		 */
		async resetPassword({ dispatch }, { token, password }) {
			const res = await apolloClient.mutate({
				mutation: gql`
					mutation resetPassword($token: String!, $password: String!) {
						resetPassword(token: $token, password: $password) {
							token
						}
					}
				`,
				variables: { token, password }
			});

			if (res.data.resetPassword.token) {
				const user = await dispatch("applyToken", res.data.resetPassword.token);
				await dispatch("getBoards", null, { root: true });
				router.push({ name: "home" });

				return user;
			}
		},

		/**
		 * Verify account
		 * @param {Store} store
		 * @param {String} verifyToken
		 */
		async verifyAccount({ dispatch }, { token }) {
			const res = await apolloClient.mutate({
				mutation: gql`
					mutation accountVerify($token: String!) {
						accountVerify(token: $token) {
							token
						}
					}
				`,
				variables: { token }
			});

			if (res.data.accountVerify.token) {
				const user = await dispatch("applyToken", res.data.accountVerify.token);
				await dispatch("getBoards", null, { root: true });
				router.push({ name: "home" });

				return user;
			}
		},

		/**
		 * Apply a received login token.
		 *
		 * @param {Store} store
		 * @param {String} token
		 */
		async applyToken({ dispatch }, token) {
			Cookie.set(COOKIE_TOKEN_NAME, token, { expires: COOKIE_EXPIRED_DAYS });
			await apolloAuth();
			return await dispatch("getMe");
		},

		async enable2FA() {
			return await axios.post("/api/v1/accounts/enable2fa");
		},

		async finalize2FA({ dispatch }, token) {
			await axios.post("/api/v1/accounts/enable2fa", { token });
			return await dispatch("getMe");
		},

		async disable2FA({ dispatch }, token) {
			await axios.post("/api/v1/accounts/disable2fa", { token });
			return await dispatch("getMe");
		},

		async getSupportedSocialAuthProviders({ commit }) {
			const providers = await axios.get("/auth/supported-social-auth-providers");
			commit("SET_AUTH_PROVIDERS", providers);

			return providers;
		},

		async unlinkSocial({ commit }, provider) {
			const user = await axios.get(`/api/v1/accounts/unlink?provider=${provider}`);
			commit("SET_LOGGED_IN_USER", user);

			return user;
		},

		protectRouter({ state, dispatch }, router) {
			// Authentication protection
			router.beforeEach(async (to, from, next) => {
				// First restricted page (try to authenticate with token)
				if (!from.name) {
					const token = Cookie.get(COOKIE_TOKEN_NAME);
					if (token) {
						await dispatch("getMe");
					}
				}

				// check authenticated
				if (to.matched.some(route => route.meta.requiresAuth)) {
					if (state.user) {
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
					if (state.user) {
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
		}
	},

	// --- MUTATIONS ---
	mutations: {
		SET_LOGGED_IN_USER(state, user) {
			state.user = user;
		},

		SET_AUTH_PROVIDERS(state, providers) {
			state.providers = providers;
		},

		LOGOUT(state) {
			state.user = null;
		},

		SET_USER_SETTINGS(state, settings) {
			state.userSettings = settings || {};
		},

		UPDATE_USER_PAGE_SETTINGS(state, { page, settings }) {
			if (!state.userSettings) state.userSettings = {};
			state.userSettings[page] = settings;
		},

		UPDATE_USER_SETTINGS(state, settings) {
			state.userSettings = defaultsDeep(settings, state.userSettings);
		}
	}
};
