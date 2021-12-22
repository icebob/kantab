import { createWebHistory, createRouter } from "vue-router";
import routes from "./routes";

export default createRouter({
	history: createWebHistory(),
	scrollBehavior: () => ({ top: 0 }),
	routes
});
