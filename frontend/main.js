/* global window */
"use strict";

// --- POLYFILLS ---
import "es6-promise/auto";
//import "babel-polyfill";

import Vue from "vue";

// --- VUE-ROUTER ---
import router from "./router";

// --- VUEX STORE ---
import store from "./store";

// --- VUE-ROUTER-SYNC ---
import { sync } from "vuex-router-sync";
sync(store, router);

// --- SERVICE WORKER ---
import "./registerServiceWorker";

// Authenticator
import authenticator from "./authenticator";
Vue.prototype.$authenticator = authenticator;

Vue.config.productionTip = false;

// --- APP ---
import App from "./App";

// --- BOOTSTRAP ---
new Vue({
	router,
	store,
	render: h => h(App),
}).$mount("#app");
