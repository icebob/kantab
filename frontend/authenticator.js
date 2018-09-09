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
		// Trigger a login
		//this.isAuthenticated();
	}

	protectRouter() {
		// Authentication protection
		router.beforeEach(async (to, from, next) => {
			// First restricted page (try to authenticate with token)
			if (!from.name && to.meta.requiresAuth) {
				const token = Cookie.get(COOKIE_TOKEN_NAME);
				if (token) {
					const user = await this.getMe();
					if (user)
						next();
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
		const res = await axios.post("/api/v1/accounts/register", params);
		if (res.verified) {
			Cookie.set(COOKIE_TOKEN_NAME, res.token, { expires: 90 });

			const user = await this.getMe();

			const { redirect } = store.state.route.query;
			router.push(redirect ? redirect : { name: "home" });

			return user;
		}

		return null;
	}

	async login(email, password) {
		const { token } = await axios.post("/api/v1/login", { email, password });
		Cookie.set(COOKIE_TOKEN_NAME, token, { expires: 90 });

		const user = await this.getMe();

		const { redirect } = store.state.route.query;
		router.push(redirect ? redirect : { name: "home" });

		return user;
	}

	async getMe() {
		const user = await axios.post("/api/v1/accounts/me");
		store.commit("SET_LOGGED_IN_USER", user);

		return user;
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
		Cookie.set(COOKIE_TOKEN_NAME, token, { expires: 90 });

		const user = await this.getMe();

		return user;
	}
};

