import Vue from "vue";
import Vuex from "vuex";
import authenticator from "../authenticator";
import { apolloClient } from "../apollo";
import gql from "graphql-tag";

Vue.use(Vuex);

import axios from "axios";
axios.defaults.headers.common["Content-Type"] = "application/json";

// Add a response interceptor
axios.interceptors.response.use(
	response => {
		// Do something with response data
		return response.data;
	},
	error => {
		// Forbidden, need to relogin
		if (error.response && error.response.status == 401) {
			authenticator.logout();
			return Promise.reject(error);
		}

		// Do something with response error
		if (error.response && error.response.data) return Promise.reject(error.response.data);

		return Promise.reject(error);
	}
);

export default new Vuex.Store({
	state: {
		// Logged in user entity
		user: null,
		providers: [],
		board: null,
		boards: [],
		lists: []
	},

	getters: {},

	actions: {
		async init({ dispatch }) {
			try {
				await dispatch("getMe");
				await dispatch("getSupportedSocialAuthProviders");
				//await dispatch("getBoards");
				await dispatch("getBoardsAll");
			} catch (err) {
				console.log("Error", err);
				//Raven.captureException(err);
			}
			//commit("READY");

			/*if (state.profile && state.profile._id) {
				this._vm.$ga.set("userId", state.profile._id);
			}*/
		},

		async getMe({ commit }) {
			const user = await axios.get("/api/v1/accounts/me");
			commit("SET_LOGGED_IN_USER", user);

			/*if (process.env.NODE_ENV == "production") {
				Raven.setUserContext(user);
				LogRocket.identify(user._id, user);
			}*/

			return user;
		},

		async getMeApollo({ commit }) {
			try {
				const user = await apolloClient.query({
					query: gql`
						query {
							me {
								id
								username
								fullName
								email
							}
						}
					`
				});
				return user.data.me;
			} catch (err) {
				console.log("error", err);
			}
			//commit("SET_LOGGED_IN_USER", user.data.me);
		},
		async getBoardById({ commit }, id) {
			try {
				const res = await apolloClient.query({
					query: gql`
						query boardById($id: String!) {
							boardById(id: $id) {
								id
								title
								slug
								description
								position
								archived
								public
							}
						}
					`,
					variables: { id }
				});
				commit("SET_ENTITY", { type: "board", entity: res.data.boardById });
				return res.data.board;
			} catch (err) {
				console.log("getBoardById error", err);
				Vue.prototype.toast.show("Could not load board: " + err.message);
			}
		},

		async getBoards({ commit }) {
			try {
				const res = await apolloClient.query({
					query: gql`
						query boards {
							boards {
								rows {
									id
									title
									description
									createdAt
									updatedAt
									owner {
										username
										fullName
										boards {
											title
										}
									}
								}
							}
						}
					`
				});
				commit("SET_ENTITIES", { type: "boards", entities: res.data.boards.rows });
				return res.data.boards;
			} catch (err) {
				console.log("getBoard error", err);
				Vue.prototype.toast.show("Could not load boards: " + err.message);
			}
		},

		async getBoardsAll({ commit }) {
			try {
				const res = await apolloClient.query({
					query: gql`
						query boardsAll {
							boardsAll {
								id
								title
								description
								createdAt
								updatedAt
								public
								owner {
									username
									fullName
									boards {
										title
									}
								}
							}
						}
					`
				});
				commit("SET_ENTITIES", { type: "boards", entities: res.data.boardsAll });
				//return res.data.boardsAll;
			} catch (err) {
				console.log("getBoard error", err);
				Vue.prototype.toast.show("Could not load boards: " + err.message);
			}
		},

		async createBoard({ commit }, input) {
			try {
				const res = await apolloClient.mutate({
					mutation: gql`
						mutation boardCreate($input: BoardCreateInput!) {
							boardCreate(input: $input) {
								id
								title
								description
							}
						}
					`,
					variables: input
				});

				commit("ADD_ENTITY", { type: "boards", entity: res.data.boardCreate });
				Vue.prototype.toast.show("Board created");
			} catch (err) {
				console.error("createBoard err", err);
				Vue.prototype.toast.show("Could not create board: " + err.message);
			}
		},

		async removeBoard({ commit }, id) {
			try {
				const res = await apolloClient.mutate({
					mutation: gql`
						mutation boardRemove($id: String!) {
							boardRemove(id: $id)
						}
					`,
					variables: { id }
				});

				commit("REMOVE_ENTITY", { type: "boards", id: res.data.boardRemove });
				Vue.prototype.toast.show("Board removed");
			} catch (err) {
				console.error("removeBoard error: ", err);
				Vue.prototype.toast.show("Board creation failed: " + err.message);
			}
		},
		async updateBoard({ commit }, input) {
			try {
				const res = await apolloClient.mutate({
					mutation: gql`
						mutation boardUpdate($input: BoardUpdateInput!) {
							boardUpdate(input: $input) {
								id
								title
								description
							}
						}
					`,
					variables: input
				});

				commit("UPDATE_ENTITY", { type: "boards", entity: res.data.boardUpdate });
				Vue.prototype.toast.show("Board updated");
			} catch (err) {
				console.error("updateBoard error: ", err);
				Vue.prototype.toast.show("Could not update board: " + err.message);
			}
		},

		async getLists({ commit }, board) {
			try {
				const res = await apolloClient.query({
					query: gql`
						query lists($board: String!) {
							lists(board: $board) {
								rows {
									id
									title
									description
									position
									createdAt
									updatedAt
								}
							}
						}
					`,
					variables: { board: board }
				});
				console.log("res.data", res.data);

				const sorted = res.data.lists.rows;
				sorted.sort((a, b) => a.position - b.position);

				commit("SET_ENTITIES", { type: "lists", entities: sorted });
				return res.data.lists;
			} catch (err) {
				console.log("getLists error", err);
				Vue.prototype.toast.show("Could not load lists: " + err.message);
			}
		},
		async createList({ commit }, input) {
			console.log("input", input);
			try {
				const res = await apolloClient.mutate({
					mutation: gql`
						mutation listCreate($input: ListCreateInput!) {
							listCreate(input: $input) {
								id
								title
								description
								position
							}
						}
					`,
					variables: input
				});
				console.log("res", res);
				commit("ADD_ENTITY", { type: "lists", entity: res.data.listCreate });
				//Vue.prototype.toast.show("Board created");
			} catch (err) {
				console.error("createList err", err);
				Vue.prototype.toast.show("Could not create list: " + err.message);
			}
		},

		async removeList({ commit }, { id }) {
			console.log("id", id);
			try {
				const res = await apolloClient.mutate({
					mutation: gql`
						mutation listRemove($id: String!) {
							listRemove(id: $id)
						}
					`,
					variables: { id }
				});
				commit("REMOVE_ENTITY", { type: "lists", id: res.data.listRemove });
				Vue.prototype.toast.show("List removed");
			} catch (err) {
				console.error("removeList error: ", err);
				Vue.prototype.toast.show("Could not remove list: " + err.message);
			}
		},
		async updateList({ commit }, input) {
			try {
				const res = await apolloClient.mutate({
					mutation: gql`
						mutation listUpdate($input: ListUpdateInput!) {
							listUpdate(input: $input) {
								id
								title
								description
							}
						}
					`,
					variables: input
				});

				commit("UPDATE_ENTITY", { type: "lists", entity: res.data.listUpdate });
				Vue.prototype.toast.show("List updated");
			} catch (err) {
				console.error("updateList error: ", err);
				Vue.prototype.toast.show("Could not update list: " + err.message);
			}
		},
		changeListOrder({ state, commit }, dragResult) {
			let arr = state.lists;
			const { removedIndex, addedIndex, payload } = dragResult;
			if (removedIndex === null && addedIndex === null) return arr;

			const result = [...arr];
			let itemToAdd = payload;

			if (removedIndex !== null) {
				itemToAdd = result.splice(removedIndex, 1)[0];
			}

			if (addedIndex !== null) {
				result.splice(addedIndex, 0, itemToAdd);
			}
			//console.log("result", result);
			//return result;
			commit("SET_NEW_LIST_ORDER", result);
		},

		async getSupportedSocialAuthProviders({ commit }) {
			const providers = await axios.get("/auth/supported-social-auth-providers");
			commit("SET_AUTH_PROVIDERS", providers);

			return providers;
		},

		async unlinkSocial({ commit }, provider) {
			const user = await axios.get(`/api/v1/accounts/unlink?provider=${provider}`);
			commit("SET_LOGGED_IN_USER", user);

			return user;
		},

		logout({ commit }) {
			commit("LOGOUT");
		}
	},

	mutations: {
		SET_LOGGED_IN_USER(state, user) {
			state.user = user;
		},

		SET_AUTH_PROVIDERS(state, providers) {
			state.providers = providers;
		},

		LOGOUT(state) {
			state.user = null;
		},

		SET_ENTITY(state, { type, entity }) {
			state[type] = entity;
		},

		SET_ENTITIES(state, { type, entities }) {
			state[type] = entities;
		},

		ADD_ENTITY(state, { type, entity }) {
			state[type].push(entity);
		},

		UPDATE_ENTITY(state, { type, entity }) {
			const found = state[type].find(b => b.id == entity.id);
			if (found) {
				Object.assign(found, entity);
			} else {
				state[type].push(entity);
			}
		},

		REMOVE_ENTITY(state, { type, id }) {
			const ix = state[type].findIndex(b => b.id === id);
			if (ix >= 0) state[type].splice(ix, 1);
		},

		SET_NEW_LIST_ORDER(state, listsInOrder) {
			state.lists = listsInOrder;
		}
	}
});
