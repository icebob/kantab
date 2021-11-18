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

				commit("SET_BOARD", res.data.boardById);
				return res.data.board;
			} catch (err) {
				console.log("getBoardById error", err);
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
				commit("SET_BOARDS", res.data.boards.rows);
				return res.data.boards;
			} catch (err) {
				console.log("getBoard error", err);
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
				commit("SET_BOARDS", res.data.boardsAll);
				//return res.data.boards;
			} catch (err) {
				console.log("getBoard error", err);
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

				commit("ADD_BOARD", res.data.boardCreate);
				Vue.prototype.toast.show("Board created");
			} catch (err) {
				console.error("createBoard err", err);
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

				commit("REMOVE_BOARD", res.data.boardRemove);
				Vue.prototype.toast.show("Board removed");
			} catch (err) {
				console.error("removeBoard error: ", err);
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

				commit("UPDATE_BOARD", res.data.boardUpdate);
				Vue.prototype.toast.show("Board updated");
			} catch (err) {
				console.error("updateBoard error: ", err);
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
									createdAt
									updatedAt
								}
							}
						}
					`,
					variables: { board }
				});
				commit("SET_LISTS", res.data.lists.rows);
				return res.data.lists;
			} catch (err) {
				console.log("getLists error", err);
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
				commit("ADD_LIST", res.data.listCreate);
				//Vue.prototype.toast.show("Board created");
			} catch (err) {
				console.error("createList err", err);
			}
		},

		async removeList({ commit }, { id, board }) {
			console.log("id", id);
			try {
				const res = await apolloClient.mutate({
					mutation: gql`
						mutation listRemove($id: String!, $board: String!) {
							listRemove(id: $id, board: $board)
						}
					`,
					variables: { id, board }
				});
				console.log("res", res);
				commit("REMOVE_LIST", res.data.listRemove);
				Vue.prototype.toast.show("List removed");
			} catch (err) {
				console.error("removeList error: ", err);
			}
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
		SET_BOARD(state, board) {
			state.board = board;
		},
		SET_BOARDS(state, boards) {
			state.boards = boards;
		},
		ADD_BOARD(state, board) {
			state.boards.push(board);
		},
		UPDATE_BOARD(state, board) {
			const found = state.boards.find(b => b.id == board.id);
			if (found) {
				Object.assign(found, board);
			} else {
				state.boards.push(board);
			}
		},
		REMOVE_BOARD(state, id) {
			const ix = state.boards.findIndex(b => b.id === id);
			if (ix >= 0) state.boards.splice(ix, 1);
		},
		SET_LISTS(state, lists) {
			state.lists = lists;
		},
		ADD_LIST(state, list) {
			state.lists.push(list);
		},
		REMOVE_LIST(state, id) {
			const ix = state.lists.findIndex(b => b.id === id);
			if (ix >= 0) state.lists.splice(ix, 1);
		},

		LOGOUT(state) {
			state.user = null;
		}
	}
});
