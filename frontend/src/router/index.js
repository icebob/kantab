import Vue from "vue";
import VueRouter from "vue-router";

import Home from "../components/Home.vue";
import StyleGuide from "../components/style-guide/Page.vue";
import Protected from "../components/Protected.vue";

Vue.use(VueRouter);

const routes = [
	{
		path: "/",
		name: "home",
		component: Home
	},
	{
		path: "/style-guide",
		name: "style-guide",
		component: StyleGuide
	},
	{
		path: "/login",
		name: "login",
		component: () =>
			import(/* webpackChunkName: "account" */ "../components/account/Login.vue"),
		meta: {
			redirectAuth: "home"
		}
	},
	{
		path: "/signup",
		name: "signup",
		component: () =>
			import(/* webpackChunkName: "account" */ "../components/account/SignUp.vue"),
		meta: {
			redirectAuth: "home"
		}
	},
	{
		path: "/forgot-password",
		name: "forgot-password",
		component: () =>
			import(/* webpackChunkName: "account" */ "../components/account/ForgotPassword.vue"),
		meta: {
			redirectAuth: "home"
		}
	},
	{
		path: "/reset-password",
		name: "reset-password",
		component: () =>
			import(/* webpackChunkName: "account" */ "../components/account/ResetPassword.vue"),
		meta: {
			redirectAuth: "home"
		}
	},
	{
		path: "/verify-account",
		name: "verify-account",
		component: () =>
			import(/* webpackChunkName: "account" */ "../components/account/VerifyAccount.vue"),
		meta: {
			redirectAuth: "home"
		}
	},
	{
		path: "/passwordless",
		name: "passwordless",
		component: () =>
			import(/* webpackChunkName: "account" */ "../components/account/Passwordless.vue"),
		meta: {
			redirectAuth: "home"
		}
	},
	{
		path: "/protected",
		name: "protected",
		component: Protected,
		meta: {
			requiresAuth: true
		}
	},
	{
		path: "/about",
		name: "about",
		component: () => import(/* webpackChunkName: "about" */ "../components/About.vue")
	},
	{
		path: "*",
		name: "404",
		component: () =>
			import(/* webpackChunkName: "account" */ "../components/account/NotFound.vue")
	}
];

const router = new VueRouter({
	mode: "history",
	routes
});

export default router;
