"use strict";

import bus from "./bus";
import router from "./router";
import store from "./store";
import axios from "axios";

import { isFunction } from "lodash";

export default new class Authenticator {

	constructor() {
		bus.$on("expiredToken", () => this.logout());


	}

	protectRoutes() {
		// Authentication protection
		router.beforeEach((to, from, next) => {
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
		router.beforeEach((to, from, next) => {
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

	async login(email, password) {
		const res = await axios.post("/auth/local", { email, password });
		store.commit("LOGIN", res);
		return res;
	}

	async logout() {
		store.commit("LOGOUT");
		router.push({ name: "login" });
	}
};

