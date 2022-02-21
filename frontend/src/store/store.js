import { defineStore } from "pinia";
import { authStore } from "./authStore";
import { graphqlClient } from "../graphqlClient";
import { gql } from "graphql-request";
import router from "../router";

import toast from "../toast";

function showInfoToast(title) {
	toast.info({ title });
}

function showErrorToast(title) {
	toast.error({ title });
}

export const mainStore = defineStore({
	id: "mainStore",

	state: () => ({
		// Selected board
		board: null,
		// All boards
		boards: []
	}),

	getters: {
		isPublicBoard: state => !!state.board?.public,
		userIsOwner: state =>
			authStore().user && state.board && state.board.owner?.id == authStore().user.id,
		userIsMember: state =>
			authStore().user &&
			state.board &&
			state.board.members.find(m => m.id == authStore().user.id)
	},
	actions: {
		async init() {
			await authStore().protectRouter();
			try {
				await authStore().getSupportedSocialAuthProviders();
				await authStore().getMe();

				await this.getBoards();
			} catch (err) {
				console.log("Error", err);
				//Raven.captureException(err);
			}
		},

		async selectBoardById(id) {
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
				this.board = data.boardById;
				return data.boardById;
			} catch (err) {
				console.log("selectBoardById error", err);
				showInfoToast("Could not load board: " + err.message);
			}
		},

		async getBoards() {
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
				this.boards = data.boards.rows;
				return data.boards.rows;
			} catch (err) {
				console.log("getBoard error", err);
				showInfoToast("Could not load boards: " + err.message);
			}
		},

		async createBoard(input) {
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

				this.boards = [...this.boards, created];
				showInfoToast(`Board '${created.title}' created`);
			} catch (err) {
				console.error("createBoard err", err);
				showErrorToast("Could not create board: " + err.message);
			}
		},

		async updateBoard(input) {
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
				//commit("UPDATE_BOARD", updated);
				const found = this.boards.find(b => b.id == updated.id);
				if (found) {
					Object.assign(found, updated);
				} else {
					this.boards = [...this.boards, updated];
				}

				// Update the selected board
				if (this.board?.id == updated.id) {
					Object.assign(this.board, updated);
				}
				showInfoToast(`Board '${updated.title}' updated`);
			} catch (err) {
				console.error("updateBoard error: ", err);
				showErrorToast("Could not update board: " + err.message);
			}
		},

		async removeBoard(id) {
			try {
				const query = gql`
					mutation boardRemove($id: String!) {
						boardRemove(id: $id)
					}
				`;

				const variables = { id };
				const data = await graphqlClient.request(query, variables);

				this.boards = this.boards.filter(b => b.id !== data.boardRemove);
				showInfoToast("Board removed");
			} catch (err) {
				console.error("removeBoard error: ", err);
				showErrorToast("Board creation failed: " + err.message);
			}
		},

		async createList(input) {
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

				this.board.lists.rows = [...this.board.lists.rows, data.listCreate];
				showInfoToast("List created");
			} catch (err) {
				console.error("createList err", err);
				showErrorToast("Could not create list: " + err.message);
			}
		},

		async updateList(input) {
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

				const found = this.board.lists.rows.find(b => b.id == data.listUpdate.id);
				if (found) {
					Object.assign(found, data.listUpdate);
				} else {
					this.board.lists.rows.push(data.listUpdate);
				}
				showInfoToast("List updated");
			} catch (err) {
				console.error("updateList error: ", err);
				showErrorToast("Could not update list: " + err.message);
			}
		},

		async removeList({ id }) {
			console.log("id", id);
			try {
				const query = gql`
					mutation listRemove($id: String!) {
						listRemove(id: $id)
					}
				`;

				const variables = { id };
				const data = await graphqlClient.request(query, variables);

				this.board.lists.rows = this.board.lists.rows.filter(b => b.id !== data.listRemove);
				showInfoToast("List removed");
			} catch (err) {
				console.error("removeList error: ", err);
				showErrorToast("Could not remove list: " + err.message);
			}
		},

		async createCard({ list, input }) {
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

				let pos = null;
				for (let i = 0; i < list.cards.rows.length; i++) {
					if (list.cards.rows[i].position > created.position) {
						pos = i;
						break;
					}
				}
				if (pos === null) {
					list.cards.rows.push(created);
				} else {
					list.cards.rows.splice(pos, 0, created);
				}

				showInfoToast(`Card '${created.title}' created`);
			} catch (err) {
				console.error("createCard err", err);
				showErrorToast("Could not create card: " + err.message);
			}
		},

		async updateCard({ list, input }) {
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

				const found = list.cards.rows.find(c => c.id == updated.id);
				if (found) {
					Object.assign(found, updated);
				} else {
					list.cards.rows.push(updated);
				}
				showInfoToast(`Card '${updated.title}' updated`);
			} catch (err) {
				console.error("updateCard error: ", err);
				showErrorToast("Could not update card: " + err.message);
			}
		},

		async removeCard({ list, id }) {
			try {
				const query = gql`
					mutation cardRemove($id: String!) {
						cardRemove(id: $id)
					}
				`;
				const variables = { id };
				await graphqlClient.request(query, variables);

				const idx = list.cards.rows.findIndex(c => c.id === id);
				if (idx >= 0) list.cards.rows.splice(idx, 1);
				showInfoToast("Card removed");
			} catch (err) {
				console.error("removeCard error: ", err);
				showErrorToast("Could not remove card: " + err.message);
			}
		},

		async changeListPosition({ fromIndex, toIndex }) {
			let arr = this.board.lists.rows;

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

			this.board.lists.rows = result;

			this.updateList({
				id: movedList.id,
				position: newPosition
			});
		},

		async changeCardPosition({ list, fromIndex, toIndex, card }) {
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

				this.updateCard({
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
	}
});
