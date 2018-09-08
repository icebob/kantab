import Vue from "vue";
import Router from "vue-router";
import Home from "./views/Home.vue";
//import Login from "./views/Login.vue";
import Protected from "./views/Protected.vue";

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
			component: () => import(/* webpackChunkName: "login" */ "./views/Login.vue"),
			//component: Login,
			meta: {
				redirectAuth: "home",
				title: "Sign In",
			},
		},
		{
			path: "/signup",
			name: "signup",
			component: () => import(/* webpackChunkName: "login" */ "./views/SignUp.vue"),
			//component: Login,
			meta: {
				redirectAuth: "home",
				title: "Sign Up",
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
		/*{
			path: "/signup",
			name: "signup",
			component: () => import("Components/Route/SignUp"),
			meta: {
				redirectAuth: "home",
				title: "Sign Up",
			},
		},
		{
			path: "/forgotpassword",
			name: "forgotpassword",
			component: () => import("Components/Route/ForgotPassword"),
			meta: {
				redirectAuth: "home",
				title: "Forgot Password",
			},
		},
		{
			path: "/resetpassword",
			name: "resetpassword",
			component: () => import("Components/Route/ResetPassword"),
			meta: {
				redirectAuth: "home",
				title: "Reset Password",
			},
		},*/
		{
			path: "/about",
			name: "about",
			// route level code-splitting
			// this generates a separate chunk (about.[hash].js) for this route
			// which is lazy-loaded when the route is visited.
			component: () => import(/* webpackChunkName: "about" */ "./views/About.vue"),
		},
		/*{
			path: "*",
			name: "404",
			component: () => import("Components/Route/404"),
			meta: {
				title: "Page Not Found",
			},
		},*/
	],
});
