"use strict";

import bus from "./bus";
import router from "./router";
import store from "./store";
import axios from "axios";
import * as Cookie from "js-cookie";

import { isFunction } from "lodash";

const COOKIE_TOKEN_NAME = "jwt-token";

export default new class Authenticator {

	constructor() {
		bus.$on("expiredToken", () => this.logout());

		this.protectRouter();
	}

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
				if (this.isAuthenticated()) {
					next();
				} else {
					next({
						name: "login",
						query: { redirect: to.fullPath },
					});
				}
			}

			// redirect if authenticated
			else if (to.matched.some(route => route.meta.redirectAuth)) {
				if (this.isAuthenticated()) {
					next({
						name: to.meta.redirectAuth,
						query: to.query,
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

	isAuthenticated() {
		return !!store.state.user;
	}

	async register(params) {
		// Handle passwordless
		if (params.password == "")
			params.password = null;

		const res = await axios.post("/api/v1/accounts/register", params);
		if (res.verified) {
			const user = await this.applyToken(res.token);

			const { redirect } = store.state.route.query;
			router.push(redirect ? redirect : { name: "home" });

			return user;
		}

		return null;
	}

	async login(email, password, token) {
		const res = await axios.post("/api/v1/accounts/login", { email, password, token });
		if (res.token) {
			const user = await this.applyToken(res.token);

			const { redirect } = store.state.route.query;
			router.push(redirect ? redirect : { name: "home" });

			return user;
		}

		return res;
	}

	async getMe() {
		return store.dispatch("getMe");
	}

	async logout() {
		store.commit("LOGOUT");
		Cookie.remove(COOKIE_TOKEN_NAME);
		router.push({ name: "login" });
	}

	async forgotPassword(email) {
		return await axios.post("/api/v1/accounts/forgot-password", { email });
	}

	async resetPassword(resetToken, password) {
		const { token } = await axios.post("/api/v1/accounts/reset-password", { token: resetToken, password });
		return await this.applyToken(token);
	}

	async verifyAccount(verifyToken) {
		const { token } = await axios.post("/api/v1/accounts/verify", { token: verifyToken });
		const user = await this.applyToken(token);
		router.push({ name: "home" });
		return user;
	}

	async passwordless(passwordlessToken) {
		const { token } = await axios.post("/api/v1/accounts/passwordless", { token: passwordlessToken });
		const user = await this.applyToken(token);
		router.push({ name: "home" });
		return user;
	}

	async enable2FA() {
		return await axios.post("/api/v1/accounts/enable2fa");
	}

	async finalize2FA(token) {
		await axios.post("/api/v1/accounts/enable2fa", { token });
		return await this.getMe();
	}

	async disable2FA(token) {
		await axios.post("/api/v1/accounts/disable2fa", { token });
		return await this.getMe();
	}

	async applyToken(token) {
		Cookie.set(COOKIE_TOKEN_NAME, token, { expires: 90 });

		return await this.getMe();
	}
};

