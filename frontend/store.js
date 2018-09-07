import Vue from "vue";
import Vuex from "vuex";
import authenticator from "./authenticator";

Vue.use(Vuex);


import axios from "axios";
axios.defaults.headers.common["Content-Type"] = "application/json";

// Add a response interceptor
axios.interceptors.response.use(response => {
	// Do something with response data
	return response.data;

}, error => {
	// Forbidden, need to relogin
	if (error.status == 401) {
		authenticator.logout();
		return Promise.reject(error);
	}

	// Do something with response error
	if (error.response && error.response.data)
		return Promise.reject(error.response.data);

	return Promise.reject(error);
});

export default new Vuex.Store({
	state: {
		// Logged in user entity
		user: null
	},

	mutations: {
		LOGIN(state, user) {
			state.user = user;
		},

		SET_LOGGED_IN_USER(state, profile) {
			state.profile = profile;
		},

		LOGOUT(state) {
			state.user = null;

		}
	},

	actions: {

	},
});
