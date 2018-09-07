import Vue from "vue";
import Router from "vue-router";
import Home from "./views/Home.vue";
import Login from "./views/Login.vue";
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
			//component: () => import("Components/Route/SignIn"),
			component: Login,
			meta: {
				redirectAuth: { name: "teams" },
				title: "Sign In",
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
				redirectAuth: { name: "teams" },
				title: "Sign Up",
			},
		},
		{
			path: "/forgotpassword",
			name: "forgotpassword",
			component: () => import("Components/Route/ForgotPassword"),
			meta: {
				redirectAuth: { name: "teams" },
				title: "Forgot Password",
			},
		},
		{
			path: "/resetpassword",
			name: "resetpassword",
			component: () => import("Components/Route/ResetPassword"),
			meta: {
				redirectAuth: { name: "teams" },
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
