import { createApp, h } from "vue";

// --- I18NEXT ---
import VueI18Next from "./i18next";

// --- VUE-ROUTER ---
import router from "./router";

// --- VUEX STORE ---
import store from "./store";

// --- VUE-ROUTER-SYNC ---
import { sync } from "vuex-router-sync";
sync(store, router);

// --- SOCKET.IO CLIENT ---
//import VueWebsocket from "vue-websocket";
//Vue.use(VueWebsocket);

// --- SERVICE WORKER ---
import "./registerServiceWorker";

// --- SWEET ALERTS ---
import swal from "sweetalert";

// --- NOTIFICATIONS (IZITOAST) ---
import iziToast from "./toast";

// --- VUE APOLLO CLIENT ---
import { apolloProvider, apolloClient } from "./apollo";

// KanTab styles
//import "./styles/style.scss";

// TailwindCSS
import "./index.css";

// Authenticator
import authenticator from "./authenticator";

// --- APP ---
import App from "./App.vue";

// --- BOOTSTRAP ---
VueI18Next().then(i18n => {
	const app = createApp({
		render: () => h(App)
	});
	app.use(store);
	app.use(router);
	app.use(i18n);
	app.use(apolloProvider);

	app.config.globalProperties.$swal = swal;
	app.config.globalProperties.$toast = iziToast;
	app.config.globalProperties.$apollo = apolloClient;
	app.config.globalProperties.$authenticator = authenticator;

	app.mount("#app");
});
