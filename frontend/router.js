import Vue from "vue";
import Router from "vue-router";
import Home from "./components/Home.vue";
import Protected from "./components/Protected.vue";

Vue.use(Router);

export default new Router({
	mode: "history",
	base: process.env.BASE_URL,
	routes: [
		{
			path: "/",
			name: "home",
			component: Home,
		},
		{
			path: "/login",
			name: "login",
			component: () => import(/* webpackChunkName: "account" */ "./components/account/Login.vue"),
			meta: {
				redirectAuth: "home"
			},
		},
		{
			path: "/signup",
			name: "signup",
			component: () => import(/* webpackChunkName: "account" */ "./components/account/SignUp.vue"),
			meta: {
				redirectAuth: "home"
			},
		},
		{
			path: "/forgot-password",
			name: "forgot-password",
			component: () => import(/* webpackChunkName: "account" */ "./components/account/ForgotPassword.vue"),
			meta: {
				redirectAuth: "home"
			},
		},
		{
			path: "/reset-password",
			name: "reset-password",
			component: () => import(/* webpackChunkName: "account" */ "./components/account/ResetPassword.vue"),
			meta: {
				redirectAuth: "home"
			},
		},
		{
			path: "/verify-account",
			name: "verify-account",
			component: () => import(/* webpackChunkName: "account" */ "./components/account/VerifyAccount.vue"),
			meta: {
				redirectAuth: "home"
			},
		},
		{
			path: "/passwordless",
			name: "passwordless",
			component: () => import(/* webpackChunkName: "account" */ "./components/account/Passwordless.vue"),
			meta: {
				redirectAuth: "home"
			},
		},
		{
			path: "/protected",
			name: "protected",
			component: Protected,
			meta: {
				requiresAuth: true
			},
		},
		{
			path: "/about",
			name: "about",
			component: () => import(/* webpackChunkName: "about" */ "./components/About.vue"),
		},
		{
			path: "*",
			name: "404",
			component: () => import(/* webpackChunkName: "account" */ "./components/account/NotFound.vue"),
		},
	],
});
