import { createApp, h } from "vue";

// --- I18NEXT ---
import VueI18Next from "./i18next";

// --- VUE-ROUTER ---
import router from "./router/index";

// --- VUEX STORE ---
import store from "./store/index";

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
import VueIziToast from "vue-izitoast";
import "izitoast/dist/css/iziToast.css";

// --- VUE APOLLO CLIENT ---
import { createApolloProvider } from "@vue/apollo-option";
import { apolloClient } from "./apollo";
const apolloProvider = createApolloProvider({
	defaultClient: apolloClient
});

// TalwindCSS
import "./index.css";

// KanTab styles
import "./styles/style.scss";

// Authenticator
import authenticator from "./authenticator";

//Vue.config.productionTip = false;

// --- APP ---
import App from "./App.vue";

//Vue.use(VueI18Next, () => {
// --- BOOTSTRAP ---
const app = createApp({
	render: () => h(App)
});
app.use(store);
app.use(router);
app.use(apolloProvider);
/*
app.use(VueIziToast, {
	theme: "light",
	position: "topRight",
	animateInside: false,
	transitionIn: "fadeInDown"
});
*/
app.config.globalProperties.$swal = swal;
app.config.globalProperties.$toast = VueIziToast;
app.config.globalProperties.$apollo = apolloClient;
app.config.globalProperties.$authenticator = authenticator;
app.config.globalProperties.$t = text => text;

app.mount("#app");
//});
