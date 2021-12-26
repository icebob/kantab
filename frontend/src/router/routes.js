import Home from "../pages/Home.vue";

export default [
	{
		path: "/",
		component: () => import("../layouts/AppLayout.vue"),
		children: [
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
				path: "/about",
				name: "about",
				component: () => import("../pages/About.vue"),
				meta: {
					requiresAuth: true
				}
			},
			{
				path: "/board/:id-:slug",
				name: "Board",
				component: () => import("../pages/Board.vue"),
				props: true
			}
		]
	},
	{
		path: "/auth",
		component: () => import("../layouts/AuthLayout.vue"),
		children: [
			{
				path: "/login",
				name: "login",
				component: () => import("../pages/auth/Login.vue"),
				meta: {
					redirectAuth: "home"
				}
			},
			{
				path: "/signup",
				name: "signup",
				component: () => import("../pages/auth/SignUp.vue"),
				meta: {
					redirectAuth: "home"
				}
			},
			{
				path: "/forgot-password",
				name: "forgot-password",
				component: () => import("../pages/auth/ForgotPassword.vue"),
				meta: {
					redirectAuth: "home"
				}
			},
			{
				path: "/reset-password",
				name: "reset-password",
				component: () => import("../pages/auth/ResetPassword.vue"),
				meta: {
					redirectAuth: "home"
				}
			},
			{
				path: "/verify-account",
				name: "verify-account",
				component: () => import("../pages/auth/VerifyAccount.vue"),
				meta: {
					redirectAuth: "home"
				}
			},
			{
				path: "/passwordless",
				name: "passwordless",
				component: () => import("../pages/auth/Passwordless.vue"),
				meta: {
					redirectAuth: "home"
				}
			}
		]
	},
	{
		path: "/:pathMatch(.*)*",
		name: "404",
		component: () => import("../pages/NotFound.vue")
	}
];
