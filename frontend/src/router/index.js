import { createWebHistory, createRouter } from "vue-router";

import Home from "../pages/Home.vue";

const routes = [
	{
		path: "/",
		name: "home",
		component: Home
	},
	{
		path: "/style-guide",
		name: "style-guide",
		component: () => import("../pages/StyleGuide.vue")
	},
	{
		path: "/protected",
		name: "protected",
		component: () => import("../pages/Protected.vue"),
		meta: {
			requiresAuth: true
		}
	},
	{
		path: "/about",
		name: "about",
		component: () => import("../pages/About.vue")
	},
	{
		path: "/board/:id",
		name: "Board",
		component: () => import("../pages/Board.vue"),
		props: true
	},
	{
		path: "/login",
		name: "login",
		component: () => import("../components/account/Login.vue"),
		meta: {
			redirectAuth: "home"
		}
	},
	{
		path: "/loginApollo",
		name: "loginApollo",
		component: () => import("../components/account/LoginApollo.vue")
		/* 		meta: {
			redirectAuth: "home"
		} */
	},
	{
		path: "/signup",
		name: "signup",
		component: () => import("../components/account/SignUp.vue"),
		meta: {
			redirectAuth: "home"
		}
	},
	{
		path: "/forgot-password",
		name: "forgot-password",
		component: () => import("../components/account/ForgotPassword.vue"),
		meta: {
			redirectAuth: "home"
		}
	},
	{
		path: "/reset-password",
		name: "reset-password",
		component: () => import("../components/account/ResetPassword.vue"),
		meta: {
			redirectAuth: "home"
		}
	},
	{
		path: "/verify-account",
		name: "verify-account",
		component: () => import("../components/account/VerifyAccount.vue"),
		meta: {
			redirectAuth: "home"
		}
	},
	{
		path: "/passwordless",
		name: "passwordless",
		component: () => import("../components/account/Passwordless.vue"),
		meta: {
			redirectAuth: "home"
		}
	},
	{
		path: "/:pathMatch(.*)*",
		name: "404",
		component: () => import("../components/account/NotFound.vue")
	}
];

export default createRouter({
	history: createWebHistory(),
	scrollBehavior: () => ({ top: 0 }),
	routes
});
