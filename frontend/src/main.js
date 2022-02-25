import { createApp, h } from "vue";

// --- I18NEXT ---
import VueI18Next from "./i18next";

// --- EVENT BUS ---
import eventBus from "./bus";

// --- VUE-ROUTER ---
import router from "./router";

// --- PINIA STORE ---
import { createPinia } from "pinia";

// --- VUE-ROUTER-SYNC ---
//import { sync } from "vuex-router-sync";
//sync(store, router);

// --- SOCKET.IO CLIENT ---
//import VueWebsocket from "vue-websocket";
//Vue.use(VueWebsocket);

// --- SERVICE WORKER ---
import "./registerServiceWorker";

// --- SWEET ALERTS ---
import swal from "sweetalert";

// --- NOTIFICATIONS (IZITOAST) ---
import iziToast from "./toast";

// --- VUE GRAPHQL CLIENT ---
import { graphqlClient } from "./graphqlClient";
// TailwindCSS
import "./styles/index.css";

// --- APP ---
import App from "./App.vue";

// --- BOOTSTRAP ---
VueI18Next().then(i18n => {
	const app = createApp({
		render: () => h(App)
	});
	app.use(eventBus);
	app.use(router);
	app.use(i18n);
	app.use(graphqlClient);
	app.use(createPinia());

	app.config.globalProperties.$swal = swal;
	app.config.globalProperties.$toast = iziToast;
	//app.config.globalProperties.$apollo = apolloClient;

	app.mount("#app");

	window.app = app;
});
