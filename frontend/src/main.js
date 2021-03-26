import Vue from "vue";

// --- I18NEXT ---
import VueI18Next from "./i18next.js";

// --- VUE-ROUTER ---
import router from "./router";

// --- VUEX STORE ---
import store from "./store";

// --- VUE-ROUTER-SYNC ---
import { sync } from "vuex-router-sync";
sync(store, router);

// --- SOCKET.IO CLIENT ---
import VueWebsocket from "vue-websocket";
Vue.use(VueWebsocket);

// --- SERVICE WORKER ---
import "./registerServiceWorker";

// --- SWEET ALERTS ---
import swal from "sweetalert";
Vue.prototype.$swal = swal;

// --- NOTIFICATIONS (IZITOAST) ---
import VueIziToast from "vue-izitoast";
import "izitoast/dist/css/iziToast.css";
Vue.use(VueIziToast, {
	theme: "light",
	position: "topRight",
	animateInside: false,
	transitionIn: "fadeInDown"
});

// Authenticator
import authenticator from "./authenticator";
Vue.prototype.$authenticator = authenticator;

Vue.config.productionTip = false;

// --- APP ---
import App from "./App";

Vue.use(VueI18Next, () => {
	// --- BOOTSTRAP ---
	new Vue({
		router,
		store,
		render: h => h(App)
	}).$mount("#app");
});
