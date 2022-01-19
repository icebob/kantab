import { createStore } from "vuex";
import AuthStore from "./auth";
//import { apolloClient } from "../apollo";
import { graphqlClient } from "../graphqlClient";
import { gql } from "graphql-request";
//import gql from "graphql-tag";
import router from "../router";

import toast from "../toast";

function showInfoToast(title) {
	toast.info({ title });
}

function showErrorToast(title) {
	toast.error({ title });
}

import axios from "axios";
axios.defaults.headers.common["Content-Type"] = "application/json";

const store = createStore({
	modules: {
		auth: AuthStore
	},

	state: {
		// Selected board
		board: null,
		// All boards
		boards: []
	},

	getters: {
		isPublicBoard: state => !!state.board?.public,
		userIsOwner: state =>
			state.auth.user && state.board && state.board.owner?.id == state.auth.user.id,
		userIsMember: state =>
			state.auth.user &&
			state.board &&
			state.board.members.find(m => m.id == state.auth.user.id)
	},

	actions: {
		async init({ dispatch }) {
			await dispatch("auth/protectRouter", router);

			try {
				await dispatch("auth/getSupportedSocialAuthProviders");
				await dispatch("auth/getMe");
				await dispatch("getBoards");
			} catch (err) {
				console.log("Error", err);
				//Raven.captureException(err);
			}
			//commit("READY");

			/*if (state.profile && state.profile._id) {
				this._vm.$ga.set("userId", state.profile._id);
			}*/
		},

		async selectBoardById({ commit }, id) {
			try {
				const query = gql`
					query boardById($id: String!) {
						boardById(id: $id) {
							id
							title
							slug
							description
							public
							archived
							createdAt
							updatedAt
							owner {
								id
								username
								fullName
								avatar
							}
							lists(page: 1, pageSize: 10, sort: "position") {
								rows {
									id
									title
									description
									position
									color
									createdAt
									updatedAt
									cards(page: 1, pageSize: 20, sort: "position") {
										rows {
											id
											title
											description
											color
											position
										}
										total
									}
								}
								total
							}
							members {
								id
								username
								fullName
								avatar
							}
						}
					}
				`;

				const variables = { id };
				const data = await graphqlClient.request(query, variables);
				commit("SET_BOARD", data.boardById);
				return data.boardById;
			} catch (err) {
				console.log("selectBoardById error", err);
				showInfoToast("Could not load board: " + err.message);
			}
		},

		async getBoards({ commit }) {
			try {
				const query = gql`
					query boards {
						boards(page: 1, pageSize: 10, sort: "title") {
							rows {
								id
								title
								slug
								description
								public
								archived
								createdAt
								updatedAt
								owner {
									username
									fullName
									avatar
								}
							}
						}
					}
				`;
				const data = await graphqlClient.request(query);
				commit("SET_BOARDS", data.boards.rows);
				return data.boards.rows;
			} catch (err) {
				console.log("getBoard error", err);
				showInfoToast("Could not load boards: " + err.message);
			}
		},

		async createBoard({ commit }, input) {
			try {
				const query = gql`
					mutation boardCreate($input: BoardCreateInput!) {
						boardCreate(input: $input) {
							id
							title
							slug
							description
							public
							archived
							createdAt
							updatedAt
							owner {
								username
								fullName
								avatar
							}
						}
					}
				`;

				const variables = { input };
				const data = await graphqlClient.request(query, variables);
				const created = data.boardCreate;

				commit("ADD_BOARD", created);
				showInfoToast(`Board '${created.title}' created`);
			} catch (err) {
				console.error("createBoard err", err);
				showErrorToast("Could not create board: " + err.message);
			}
		},

		async updateBoard({ commit }, input) {
			try {
				const query = gql`
					mutation boardUpdate($input: BoardUpdateInput!) {
						boardUpdate(input: $input) {
							id
							title
							slug
							description
							public
							archived
							createdAt
							updatedAt
							owner {
								username
								fullName
								avatar
							}
						}
					}
				`;

				const variables = { input };
				const data = await graphqlClient.request(query, variables);
				const updated = data.boardUpdate;
				commit("UPDATE_BOARD", updated);
				showInfoToast(`Board '${updated.title}' updated`);
			} catch (err) {
				console.error("updateBoard error: ", err);
				showErrorToast("Could not update board: " + err.message);
			}
		},

		async removeBoard({ commit }, id) {
			try {
				const query = gql`
					mutation boardRemove($id: String!) {
						boardRemove(id: $id)
					}
				`;

				const variables = { id };
				const data = await graphqlClient.request(query, variables);
				commit("REMOVE_BOARD", data.boardRemove);
				showInfoToast("Board removed");
			} catch (err) {
				console.error("removeBoard error: ", err);
				showErrorToast("Board creation failed: " + err.message);
			}
		},

		async createList({ commit }, input) {
			try {
				const query = gql`
					mutation listCreate($input: ListCreateInput!) {
						listCreate(input: $input) {
							id
							title
							description
							position
							cards(page: 1, pageSize: 20, sort: "position") {
								rows {
									id
									title
									description
									position
								}
								total
							}
						}
					}
				`;

				const variables = { input };
				const data = await graphqlClient.request(query, variables);

				commit("ADD_LIST", data.listCreate);
				showInfoToast("List created");
			} catch (err) {
				console.error("createList err", err);
				showErrorToast("Could not create list: " + err.message);
			}
		},

		async updateList({ commit }, input) {
			try {
				const query = gql`
					mutation listUpdate($input: ListUpdateInput!) {
						listUpdate(input: $input) {
							id
							title
							description
							position
							cards(page: 1, pageSize: 20, sort: "position") {
								rows {
									id
									title
									description
									position
								}
								total
							}
						}
					}
				`;
				const variables = { input };
				const data = await graphqlClient.request(query, variables);

				commit("UPDATE_LIST", data.listUpdate);
				showInfoToast("List updated");
			} catch (err) {
				console.error("updateList error: ", err);
				showErrorToast("Could not update list: " + err.message);
			}
		},

		async removeList({ commit }, { id }) {
			console.log("id", id);
			try {
				const query = gql`
					mutation listRemove($id: String!) {
						listRemove(id: $id)
					}
				`;

				const variables = { id };
				const data = await graphqlClient.request(query, variables);
				commit("REMOVE_LIST", data.listRemove);
				showInfoToast("List removed");
			} catch (err) {
				console.error("removeList error: ", err);
				showErrorToast("Could not remove list: " + err.message);
			}
		},

		async createCard({ commit }, { list, input }) {
			try {
				const query = gql`
					mutation cardCreate($input: CardCreateInput!) {
						cardCreate(input: $input) {
							id
							title
							description
							position
							color
						}
					}
				`;

				const variables = { input };
				const data = await graphqlClient.request(query, variables);
				const created = data.cardCreate;
				commit("ADD_CARD", { list, card: created });
				showInfoToast(`Card '${created.title}' created`);
			} catch (err) {
				console.error("createCard err", err);
				showErrorToast("Could not create card: " + err.message);
			}
		},

		async updateCard({ commit }, { list, input }) {
			try {
				const query = gql`
					mutation cardUpdate($input: CardUpdateInput!) {
						cardUpdate(input: $input) {
							id
							title
							description
							position
							color
						}
					}
				`;
				const variables = { input };

				const data = await graphqlClient.request(query, variables);
				const updated = data.cardUpdate;
				commit("UPDATE_CARD", { list, card: updated });
				showInfoToast(`Card '${updated.title}' updated`);
			} catch (err) {
				console.error("updateCard error: ", err);
				showErrorToast("Could not update card: " + err.message);
			}
		},

		async removeCard({ commit }, { list, id }) {
			try {
				const query = gql`
					mutation cardRemove($id: String!) {
						cardRemove(id: $id)
					}
				`;
				const variables = { id };
				await graphqlClient.request(query, variables);
				commit("REMOVE_CARD", { list, id });
				showInfoToast("Card removed");
			} catch (err) {
				console.error("removeCard error: ", err);
				showErrorToast("Could not remove card: " + err.message);
			}
		},

		async changeListPosition({ state, dispatch, commit }, { fromIndex, toIndex }) {
			let arr = state.board.lists.rows;

			const result = [...arr];
			let movedList;

			if (fromIndex !== null) {
				movedList = result.splice(fromIndex, 1)[0];
			}

			if (toIndex !== null) {
				result.splice(toIndex, 0, movedList);
			}

			let newPosition = 0;
			const toPrev = result[toIndex - 1];
			const toNext = result[toIndex + 1];
			if (!toNext) {
				newPosition = Math.ceil(toPrev.position + 1);
			} else if (!toPrev) {
				newPosition = Math.floor(toNext.position - 1);
			} else {
				newPosition = (toNext.position + toPrev.position) / 2;
			}
			console.debug(
				`Move ${movedList.title} to ${newPosition}. Between ${toNext?.position} <-> ${toPrev?.position}`
			);

			movedList.position = newPosition;
			commit("SET_NEW_LIST_ORDER", result);

			await dispatch("updateList", {
				id: movedList.id,
				position: newPosition
			});
		},

		async changeCardPosition({ state, dispatch, commit }, { list, fromIndex, toIndex, card }) {
			const result = [...list.cards.rows];

			if (fromIndex !== null) {
				result.splice(fromIndex, 1);
			}

			if (toIndex !== null) {
				result.splice(toIndex, 0, card);

				let newPosition = 0;
				const toPrev = result[toIndex - 1];
				const toNext = result[toIndex + 1];
				if (!toNext && !toPrev) {
					newPosition = 1;
				} else if (!toNext) {
					newPosition = Math.ceil(toPrev.position + 1);
				} else if (!toPrev) {
					newPosition = Math.floor(toNext.position - 1);
				} else {
					newPosition = (toNext.position + toPrev.position) / 2;
				}
				console.debug(
					`Move ${card.title} to ${newPosition}. Between ${toNext?.position} <-> ${toPrev?.position}`
				);

				card.position = newPosition;
				list.cards.rows = result; // TODO
				// commit("SET_NEW_LIST_ORDER", result);

				await dispatch("updateCard", {
					list,
					input: {
						id: card.id,
						list: list.id,
						position: newPosition
					}
				});
			} else {
				// First call at moving between lists
				list.cards.rows = result; // TODO
			}
		}
	},

	mutations: {
		SET_BOARD(state, board) {
			state.board = board;
		},

		SET_BOARDS(state, boards) {
			state.boards = boards;
		},

		ADD_BOARD(state, board) {
			state.boards = [...state.boards, board];
		},

		UPDATE_BOARD(state, board) {
			const found = state.boards.find(b => b.id == board.id);
			if (found) {
				Object.assign(found, board);
			} else {
				state.boards = [...state.boards, board];
			}

			// Update the selected board
			if (state.board?.id == board.id) {
				Object.assign(state.board, board);
			}
		},

		REMOVE_BOARD(state, id) {
			state.boards = state.boards.filter(b => b.id !== id);
		},

		ADD_LIST(state, list) {
			state.board.lists.rows = [...state.board.lists.rows, list];
		},

		UPDATE_LIST(state, list) {
			const found = state.board.lists.rows.find(b => b.id == list.id);
			if (found) {
				Object.assign(found, list);
			} else {
				state.board.lists.rows.push(list);
			}
		},

		REMOVE_LIST(state, id) {
			state.board.lists.rows = state.board.lists.rows.filter(b => b.id !== id);
		},

		ADD_CARD(state, { list, card }) {
			// Find the correct position
			let pos = null;
			for (let i = 0; i < list.cards.rows.length; i++) {
				if (list.cards.rows[i].position > card.position) {
					pos = i;
					break;
				}
			}
			if (pos === null) {
				list.cards.rows.push(card);
			} else {
				list.cards.rows.splice(pos, 0, card);
			}
		},

		UPDATE_CARD(state, { list, card }) {
			const found = list.cards.rows.find(c => c.id == card.id);
			if (found) {
				Object.assign(found, card);
			} else {
				list.cards.rows.push(card);
			}
		},

		REMOVE_CARD(state, { list, id }) {
			const idx = list.cards.rows.findIndex(c => c.id === id);
			if (idx >= 0) list.cards.rows.splice(idx, 1);
		},

		SET_NEW_LIST_ORDER(state, listsInOrder) {
			state.board.lists.rows = listsInOrder;
		}
	}
});

export default store;

// Add a response interceptor
axios.interceptors.response.use(
	response => {
		// Do something with response data
		return response.data;
	},
	error => {
		// Forbidden, need to relogin
		if (error.response && error.response.status == 401) {
			store.commit("logout");
			return Promise.reject(error);
		}

		// Do something with response error
		if (error.response && error.response.data) return Promise.reject(error.response.data);

		return Promise.reject(error);
	}
);
