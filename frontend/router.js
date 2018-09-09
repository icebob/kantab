import Vue from "vue";
import Router from "vue-router";
import Home from "./views/Home.vue";
//import Login from "./views/Login.vue";
import Protected from "./views/Protected.vue";
import NotFound from "./views/NotFound.vue";

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
			component: () => import(/* webpackChunkName: "account" */ "./views/Login.vue"),
			meta: {
				redirectAuth: "home",
				title: "Sign In",
			},
		},
		{
			path: "/signup",
			name: "signup",
			component: () => import(/* webpackChunkName: "account" */ "./views/SignUp.vue"),
			meta: {
				redirectAuth: "home",
				title: "Sign Up",
			},
		},
		{
			path: "/forgotpassword",
			name: "forgotpassword",
			component: () => import(/* webpackChunkName: "account" */ "./views/ForgotPassword.vue"),
			meta: {
				redirectAuth: "home",
				title: "Forgot Password",
			},
		},
		{
			path: "/resetpassword",
			name: "resetpassword",
			component: () => import(/* webpackChunkName: "account" */ "./views/ResetPassword.vue"),
			meta: {
				redirectAuth: "home",
				title: "Reset Password",
			},
		},
		{
			path: "/protected",
			name: "protected",
			//component: () => import("Components/Route/SignIn"),
			component: Protected,
			meta: {
				requiresAuth: true,
				title: "Protected page",
			},
		},
		{
			path: "/about",
			name: "about",
			// route level code-splitting
			// this generates a separate chunk (about.[hash].js) for this route
			// which is lazy-loaded when the route is visited.
			component: () => import(/* webpackChunkName: "about" */ "./views/About.vue"),
		},
		{
			path: "*",
			name: "404",
			component: NotFound,
		},
	],
});
