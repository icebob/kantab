"use strict";

"use strict";

const path = require("path");
const Runner = require("moleculer").Runner;
const kleur = require("kleur");
const C = require("../../constants");
const Helper = require("./helper-actions");
const _ = require("lodash");

const EMPTY_LIST_RESPONSE = {
	page: 1,
	pageSize: 10,
	rows: [],
	total: 0,
	totalPages: 0
};

//jest.setTimeout(60000);

describe("Integration test", () => {
	let broker = null;
	let helper = null;

	const state = {
		broker: null,
		users: {
			u1: null,
			u2: null,
			u3: null
		},
		contexts: {
			u1: null,
			u2: null,
			u3: null,
			guest: {}
		},
		boards: {
			u1_b1: null,
			u2_b1: null
		}
	};

	beforeAll(async () => {
		console.log(kleur.magenta().bold("Booting Moleculer project for integration tests..."));

		try {
			const runner = new Runner();
			broker = await runner.start([
				process.argv[0],
				__filename,
				path.join(__dirname, "..", "..", "services", "**", "*.service.js")
			]);

			console.log(kleur.magenta().bold("Broker started. NodeID:"), broker.nodeID);

			// Disable verification
			await broker.call("v1.config.set", {
				key: "accounts.verification.enabled",
				value: false
			});
			// Disable mail sending
			await broker.call("v1.config.set", {
				key: "mail.enabled",
				value: false
			});

			state.broker = broker;
			helper = new Helper(state);
		} catch (err) {
			console.error(err);
			process.exit(1);
		}
	}, 60000);

	afterAll(async () => {
		if (broker) await broker.stop();
	}, 10000);

	async function checkResponse(promise, expected) {
		const res = await promise;
		expect(res).toEqual(expected);

		return res;
	}

	async function checkError(promise, errorName) {
		try {
			await promise;
		} catch (err) {
			if (typeof errorName === "string") {
				//if (err.name != errorName) console.log(err);
				expect(err.name).toBe(errorName);
			} else if (_.isObject(errorName)) {
				Object.keys(errorName).forEach(key => {
					expect(err[key]).toBe(errorName[key]);
				});
			}
		}
	}

	async function checkBoardVisibility(fn, params, responses) {
		for (const user of Object.keys(responses)) {
			const res = responses[user];
			if (res.data) {
				await checkResponse(fn(user, params), res.data);
			} else if (res.error) {
				await checkError(fn(user, params), res.error);
			}
		}
	}

	describe("Set up test environment", () => {
		describe("Create accounts", () => {
			it("create U1 account", async () => {
				const user = await helper.registerAccount({
					email: "u1@kantab.io",
					username: "u1",
					fullName: "U1",
					password: "u1-pass"
				});

				expect(user).toEqual(
					expect.objectContaining({
						email: "u1@kantab.io",
						username: "u1",
						fullName: "U1",
						roles: [C.ROLE_USER],
						verified: true,
						status: 1
					})
				);

				state.users.u1 = user;
			});

			it("create U2 account", async () => {
				const user = await helper.registerAccount({
					email: "u2@kantab.io",
					username: "u2",
					fullName: "U2",
					password: "u2-pass"
				});

				expect(user).toEqual(
					expect.objectContaining({
						email: "u2@kantab.io",
						username: "u2",
						fullName: "U2",
						roles: [C.ROLE_USER],
						verified: true,
						status: 1
					})
				);

				state.users.u2 = user;
			});

			it("create U3 account", async () => {
				const user = await helper.registerAccount({
					email: "u3@kantab.io",
					username: "u3",
					fullName: "U3",
					password: "u3-pass"
				});

				expect(user).toEqual(
					expect.objectContaining({
						email: "u3@kantab.io",
						username: "u3",
						fullName: "U3",
						roles: [C.ROLE_USER],
						verified: true,
						status: 1
					})
				);

				state.users.u3 = user;
			});
		});

		describe("Login to accounts", () => {
			it("login with U1 account", async () => {
				const res = await helper.login(state.users.u1.email, "u1-pass");

				expect(res).toEqual({ token: expect.any(String) });

				state.contexts.u1 = {
					meta: {
						userID: state.users.u1.id,
						token: res.token,
						roles: [C.ROLE_AUTHENTICATED, ...state.users.u1.roles]
					}
				};
			});

			it("login with U2 account", async () => {
				const res = await helper.login(state.users.u2.email, "u2-pass");

				expect(res).toEqual({ token: expect.any(String) });

				state.contexts.u2 = {
					meta: {
						userID: state.users.u2.id,
						token: res.token,
						roles: [C.ROLE_AUTHENTICATED, ...state.users.u2.roles]
					}
				};
			});
		});
	});

	describe("Test boards operations", () => {
		it("should return empty board list", async () => {
			await checkResponse(helper.boards("u1"), {
				page: 1,
				pageSize: 10,
				rows: [],
				total: 0,
				totalPages: 0
			});
			await checkResponse(helper.boards("u2"), {
				page: 1,
				pageSize: 10,
				rows: [],
				total: 0,
				totalPages: 0
			});
			await checkResponse(helper.boards("guest"), {
				page: 1,
				pageSize: 10,
				rows: [],
				total: 0,
				totalPages: 0
			});
		});

		function checkBoardPermission() {}

		describe("Test with private board", () => {
			it("create 'b1' board by 'U1'", async () => {
				const res = await helper.boardCreate("u1", {
					title: "U1 B1",
					description: "U1 B1 description"
				});
				expect(res).toEqual(
					expect.objectContaining({
						id: expect.any(String),
						title: "U1 B1",
						slug: "u1-b1",
						description: "U1 B1 description",
						owner: state.users.u1.id,
						members: [state.users.u1.id]
					})
				);

				state.boards.u1_b1 = res;
			});

			describe("Check B1 board permissions", () => {
				it("check visibility with 'list'", async () => {
					await checkBoardVisibility(helper.boards, null, {
						u1: {
							data: {
								page: 1,
								pageSize: 10,
								rows: [state.boards.u1_b1],
								total: 1,
								totalPages: 1
							}
						},
						u2: { data: EMPTY_LIST_RESPONSE },
						guest: { data: EMPTY_LIST_RESPONSE }
					});
				});

				it("check visibility with 'find'", async () => {
					await checkBoardVisibility(helper.boardsAll, null, {
						u1: { data: [state.boards.u1_b1] },
						u2: { data: [] },
						guest: { data: [] }
					});
				});

				it("check visibility with 'count'", async () => {
					await checkBoardVisibility(helper.boardsCount, null, {
						u1: { data: 1 },
						u2: { data: 0 },
						guest: { data: 0 }
					});
				});

				it("check visibility with 'get'", async () => {
					expect.assertions(3);

					await checkBoardVisibility(
						helper.boardByID,
						{ id: state.boards.u1_b1.id },
						{
							u1: { data: state.boards.u1_b1 },
							u2: { error: "EntityNotFoundError" },
							guest: { error: "EntityNotFoundError" }
						}
					);
				});

				it("check visibility with 'resolve'", async () => {
					await checkBoardVisibility(
						helper.boardResolve,
						{ id: state.boards.u1_b1.id },
						{
							u1: { data: state.boards.u1_b1 },
							u2: { data: null },
							guest: { data: null }
						}
					);
				});

				it("check update permissions", async () => {
					expect.assertions(4);

					state.boards.u1_b1 = await checkResponse(
						helper.boardUpdate("u1", {
							id: state.boards.u1_b1.id,
							title: "U1 B1 updated"
						}),
						{
							...state.boards.u1_b1,
							title: "U1 B1 updated",
							slug: "u1-b1-updated",
							updatedAt: expect.any(Number)
						}
					);

					await checkError(
						helper.boardUpdate("u2", {
							id: state.boards.u1_b1.id,
							title: "U1 B1 updated by U2"
						}),
						"EntityNotFoundError"
					);
					await checkError(
						helper.boardUpdate("guest", {
							id: state.boards.u1_b1.id,
							title: "U1 B1 updated by guest"
						}),
						"EntityNotFoundError"
					);

					await checkResponse(
						helper.boardByID("u1", { id: state.boards.u1_b1.id }),
						state.boards.u1_b1
					);
				});
			});

			describe("Check B1 board permissions if U2 is member", () => {
				it("add U2 to B1 board as member", async () => {
					expect.assertions(6);

					await checkError(
						helper.boardAddMembers("u2", {
							id: state.boards.u1_b1.id,
							members: [state.users.u2.id]
						}),
						"EntityNotFoundError"
					);
					await checkError(
						helper.boardAddMembers("u2", {
							id: state.boards.u1_b1.id,
							members: [state.users.u3.id]
						}),
						"EntityNotFoundError"
					);
					await checkError(
						helper.boardAddMembers("guest", {
							id: state.boards.u1_b1.id,
							members: [state.users.u2.id]
						}),
						"EntityNotFoundError"
					);

					state.boards.u1_b1 = await checkResponse(
						helper.boardAddMembers("u1", {
							id: state.boards.u1_b1.id,
							members: [state.users.u2.id]
						}),
						{
							...state.boards.u1_b1,
							members: [state.users.u1.id, state.users.u2.id],
							updatedAt: expect.any(Number)
						}
					);

					await checkResponse(
						helper.boardByID("u1", { id: state.boards.u1_b1.id }),
						state.boards.u1_b1
					);
					await checkResponse(
						helper.boardByID("u2", { id: state.boards.u1_b1.id }),
						state.boards.u1_b1
					);
				});

				it("check visibility with 'list'", async () => {
					await checkBoardVisibility(helper.boards, null, {
						u1: {
							data: {
								page: 1,
								pageSize: 10,
								rows: [state.boards.u1_b1],
								total: 1,
								totalPages: 1
							}
						},
						u2: {
							data: {
								page: 1,
								pageSize: 10,
								rows: [state.boards.u1_b1],
								total: 1,
								totalPages: 1
							}
						},
						guest: { data: EMPTY_LIST_RESPONSE }
					});
				});

				it("check visibility with 'find'", async () => {
					await checkBoardVisibility(helper.boardsAll, null, {
						u1: { data: [state.boards.u1_b1] },
						u2: { data: [state.boards.u1_b1] },
						guest: { data: [] }
					});
				});

				it("check visibility with 'count'", async () => {
					await checkBoardVisibility(helper.boardsCount, null, {
						u1: { data: 1 },
						u2: { data: 1 },
						guest: { data: 0 }
					});
				});

				it("check visibility with 'get'", async () => {
					expect.assertions(3);

					await checkBoardVisibility(
						helper.boardByID,
						{ id: state.boards.u1_b1.id },
						{
							u1: { data: state.boards.u1_b1 },
							u2: { data: state.boards.u1_b1 },
							guest: { error: "EntityNotFoundError" }
						}
					);
				});

				it("check visibility with 'resolve'", async () => {
					await checkBoardVisibility(
						helper.boardResolve,
						{ id: state.boards.u1_b1.id },
						{
							u1: { data: state.boards.u1_b1 },
							u2: { data: state.boards.u1_b1 },
							guest: { data: null }
						}
					);
				});

				it("check update permissions", async () => {
					expect.assertions(4);

					state.boards.u1_b1 = await checkResponse(
						helper.boardUpdate("u2", {
							id: state.boards.u1_b1.id,
							title: "U1 B1 updated by U2"
						}),
						{
							...state.boards.u1_b1,
							title: "U1 B1 updated by U2",
							slug: "u1-b1-updated-by-u2",
							updatedAt: expect.any(Number)
						}
					);

					await checkError(
						helper.boardUpdate("guest", {
							id: state.boards.u1_b1.id,
							title: "U1 B1 updated by guest"
						}),
						"EntityNotFoundError"
					);

					await checkResponse(
						helper.boardByID("u1", { id: state.boards.u1_b1.id }),
						state.boards.u1_b1
					);
					await checkResponse(
						helper.boardByID("u2", { id: state.boards.u1_b1.id }),
						state.boards.u1_b1
					);
				});

				it("check addMembers permissions", async () => {
					expect.assertions(3);

					await checkError(
						helper.boardAddMembers("u2", {
							id: state.boards.u1_b1.id,
							members: [state.users.u3.id]
						}),
						{
							name: "MoleculerClientError",
							message: "You have no right for this operation!"
						}
					);
					await checkError(
						helper.boardAddMembers("guest", {
							id: state.boards.u1_b1.id,
							members: [state.users.u3.id]
						}),
						"EntityNotFoundError"
					);
				});

				it("check removeMembers permissions", async () => {
					expect.assertions(4);

					await checkError(
						helper.boardRemoveMembers("u1", {
							id: state.boards.u1_b1.id,
							members: [state.users.u1.id]
						}),
						{ message: "The board owner can't be removed from the members." }
					);

					await checkError(
						helper.boardRemoveMembers("u2", {
							id: state.boards.u1_b1.id,
							members: [state.users.u2.id]
						}),
						{
							name: "MoleculerClientError",
							message: "You have no right for this operation!"
						}
					);
					await checkError(
						helper.boardRemoveMembers("guest", {
							id: state.boards.u1_b1.id,
							members: [state.users.u2.id]
						}),
						"EntityNotFoundError"
					);
				});
			});

			describe("Check B1 board permissions if board is archived", () => {
				it("set board to archive", async () => {
					expect.assertions(4);

					await checkError(helper.boardArchive("u2", state.boards.u1_b1.id), {
						name: "MoleculerClientError",
						message: "You have no right for this operation!"
					});
					await checkError(
						helper.boardArchive("guest", state.boards.u1_b1.id),
						"EntityNotFoundError"
					);

					state.boards.u1_b1 = await checkResponse(
						helper.boardArchive("u1", state.boards.u1_b1.id),
						{
							...state.boards.u1_b1,
							archived: true,
							archivedAt: expect.any(Number),
							updatedAt: expect.any(Number)
						}
					);
				});

				it("check visibility with 'list'", async () => {
					await checkBoardVisibility(helper.boards, null, {
						u1: {
							data: EMPTY_LIST_RESPONSE
						},
						u2: {
							data: EMPTY_LIST_RESPONSE
						},
						guest: { data: EMPTY_LIST_RESPONSE }
					});
				});

				it("check visibility with 'list' and disabled scope", async () => {
					await checkBoardVisibility(
						helper.boards,
						{ scope: ["membership", "notDeleted"] }, // TODO: it should work with `scope: false` as well
						{
							u1: {
								data: {
									page: 1,
									pageSize: 10,
									rows: [state.boards.u1_b1],
									total: 1,
									totalPages: 1
								}
							},
							u2: {
								data: {
									page: 1,
									pageSize: 10,
									rows: [state.boards.u1_b1],
									total: 1,
									totalPages: 1
								}
							},
							guest: { data: EMPTY_LIST_RESPONSE }
						}
					);
				});

				it("check visibility with 'find'", async () => {
					await checkBoardVisibility(helper.boardsAll, null, {
						u1: { data: [] },
						u2: { data: [] },
						guest: { data: [] }
					});
				});

				it("check visibility with 'find' and disabled scope", async () => {
					await checkBoardVisibility(
						helper.boardsAll,
						{ scope: ["membership", "notDeleted"] }, // TODO: it should work with `scope: false` as well
						{
							u1: { data: [state.boards.u1_b1] },
							u2: { data: [state.boards.u1_b1] },
							guest: { data: [] }
						}
					);
				});

				it("check visibility with 'count'", async () => {
					await checkBoardVisibility(helper.boardsCount, null, {
						u1: { data: 0 },
						u2: { data: 0 },
						guest: { data: 0 }
					});
				});

				it("check visibility with 'count' and disabled scope", async () => {
					await checkBoardVisibility(
						helper.boardsCount,
						{ scope: ["membership", "notDeleted"] }, // TODO: it should work with `scope: false` as well,
						{
							u1: { data: 1 },
							u2: { data: 1 },
							guest: { data: 0 }
						}
					);
				});

				it("check visibility with 'get'", async () => {
					expect.assertions(3);

					await checkBoardVisibility(
						helper.boardByID,
						{ id: state.boards.u1_b1.id },
						{
							u1: { error: "EntityNotFoundError" },
							u2: { error: "EntityNotFoundError" },
							guest: { error: "EntityNotFoundError" }
						}
					);
				});

				it("check visibility with 'get' and disabled scope", async () => {
					expect.assertions(3);

					await checkBoardVisibility(
						helper.boardByID,
						{ id: state.boards.u1_b1.id, scope: ["membership", "notDeleted"] }, // TODO: it should work with `scope: false` as well,
						{
							u1: { data: state.boards.u1_b1 },
							u2: { data: state.boards.u1_b1 },
							guest: { error: "EntityNotFoundError" }
						}
					);
				});

				it("check visibility with 'resolve'", async () => {
					await checkBoardVisibility(
						helper.boardResolve,
						{ id: state.boards.u1_b1.id },
						{
							u1: { data: null },
							u2: { data: null },
							guest: { data: null }
						}
					);
				});

				it("check visibility with 'resolve' and disabled scope", async () => {
					await checkBoardVisibility(
						helper.boardResolve,
						{ id: state.boards.u1_b1.id, scope: ["membership", "notDeleted"] }, // TODO: it should work with `scope: false` as well,
						{
							u1: { data: state.boards.u1_b1 },
							u2: { data: state.boards.u1_b1 },
							guest: { data: null }
						}
					);
				});

				it("check update permissions", async () => {
					expect.assertions(3);

					await checkBoardVisibility(
						helper.boardUpdate,
						{ id: state.boards.u1_b1.id, title: "U1 B1 updated & archived" },
						{
							u1: { error: "EntityNotFoundError" },
							u2: { error: "EntityNotFoundError" },
							guest: { error: "EntityNotFoundError" }
						}
					);
				});

				it("check addMembers permissions", async () => {
					expect.assertions(3);

					await checkBoardVisibility(
						helper.boardAddMembers,
						{ id: state.boards.u1_b1.id, members: [state.users.u2.id] },
						{
							u1: { error: "EntityNotFoundError" },
							u2: { error: "EntityNotFoundError" },
							guest: { error: "EntityNotFoundError" }
						}
					);
				});

				it("check removeMembers permissions", async () => {
					expect.assertions(3);

					await checkBoardVisibility(
						helper.boardRemoveMembers,
						{ id: state.boards.u1_b1.id, members: [state.users.u2.id] },
						{
							u1: { error: "EntityNotFoundError" },
							u2: { error: "EntityNotFoundError" },
							guest: { error: "EntityNotFoundError" }
						}
					);
				});
			});

			describe("Check B1 board permissions if board is unarchived", () => {
				it("set board to unarchive", async () => {
					expect.assertions(4);

					await checkError(helper.boardUnarchive("u2", state.boards.u1_b1.id), {
						name: "MoleculerClientError",
						message: "You have no right for this operation!"
					});
					await checkError(
						helper.boardUnarchive("guest", state.boards.u1_b1.id),
						"EntityNotFoundError"
					);

					state.boards.u1_b1 = await checkResponse(
						helper.boardUnarchive("u1", state.boards.u1_b1.id),
						{
							...state.boards.u1_b1,
							archived: false,
							archivedAt: null,
							updatedAt: expect.any(Number)
						}
					);
				});

				it("check visibility with 'list'", async () => {
					await checkBoardVisibility(helper.boards, null, {
						u1: {
							data: {
								page: 1,
								pageSize: 10,
								rows: [state.boards.u1_b1],
								total: 1,
								totalPages: 1
							}
						},
						u2: {
							data: {
								page: 1,
								pageSize: 10,
								rows: [state.boards.u1_b1],
								total: 1,
								totalPages: 1
							}
						},
						guest: { data: EMPTY_LIST_RESPONSE }
					});
				});

				it("check visibility with 'find'", async () => {
					await checkBoardVisibility(helper.boardsAll, null, {
						u1: { data: [state.boards.u1_b1] },
						u2: { data: [state.boards.u1_b1] },
						guest: { data: [] }
					});
				});

				it("check visibility with 'count'", async () => {
					await checkBoardVisibility(helper.boardsCount, null, {
						u1: { data: 1 },
						u2: { data: 1 },
						guest: { data: 0 }
					});
				});

				it("check visibility with 'get'", async () => {
					expect.assertions(3);

					await checkBoardVisibility(
						helper.boardByID,
						{ id: state.boards.u1_b1.id },
						{
							u1: { data: state.boards.u1_b1 },
							u2: { data: state.boards.u1_b1 },
							guest: { error: "EntityNotFoundError" }
						}
					);
				});

				it("check visibility with 'resolve'", async () => {
					await checkBoardVisibility(
						helper.boardResolve,
						{ id: state.boards.u1_b1.id },
						{
							u1: { data: state.boards.u1_b1 },
							u2: { data: state.boards.u1_b1 },
							guest: { data: null }
						}
					);
				});
			});

			describe("Check B1 board permissions if ownership is transferred to U2", () => {
				it("transfer ownership", async () => {
					expect.assertions(4);

					await checkError(
						helper.boardTransferOwnership("u2", {
							id: state.boards.u1_b1.id,
							owner: state.users.u2.id
						}),
						{
							name: "MoleculerClientError",
							message: "You have no right for this operation!"
						}
					);
					await checkError(
						helper.boardTransferOwnership("guest", {
							id: state.boards.u1_b1.id,
							owner: state.users.u2.id
						}),
						"EntityNotFoundError"
					);

					state.boards.u1_b1 = await checkResponse(
						helper.boardTransferOwnership("u1", {
							id: state.boards.u1_b1.id,
							owner: state.users.u2.id
						}),
						{
							...state.boards.u1_b1,
							owner: state.users.u2.id,
							members: [state.users.u2.id, state.users.u1.id],
							updatedAt: expect.any(Number)
						}
					);
				});

				it("check visibility with 'list'", async () => {
					await checkBoardVisibility(helper.boards, null, {
						u1: {
							data: {
								page: 1,
								pageSize: 10,
								rows: [state.boards.u1_b1],
								total: 1,
								totalPages: 1
							}
						},
						u2: {
							data: {
								page: 1,
								pageSize: 10,
								rows: [state.boards.u1_b1],
								total: 1,
								totalPages: 1
							}
						},
						guest: { data: EMPTY_LIST_RESPONSE }
					});
				});

				it("check visibility with 'find'", async () => {
					await checkBoardVisibility(helper.boardsAll, null, {
						u1: { data: [state.boards.u1_b1] },
						u2: { data: [state.boards.u1_b1] },
						guest: { data: [] }
					});
				});

				it("check visibility with 'count'", async () => {
					await checkBoardVisibility(helper.boardsCount, null, {
						u1: { data: 1 },
						u2: { data: 1 },
						guest: { data: 0 }
					});
				});

				it("check visibility with 'get'", async () => {
					expect.assertions(3);

					await checkBoardVisibility(
						helper.boardByID,
						{ id: state.boards.u1_b1.id },
						{
							u1: { data: state.boards.u1_b1 },
							u2: { data: state.boards.u1_b1 },
							guest: { error: "EntityNotFoundError" }
						}
					);
				});

				it("check visibility with 'resolve'", async () => {
					await checkBoardVisibility(
						helper.boardResolve,
						{ id: state.boards.u1_b1.id },
						{
							u1: { data: state.boards.u1_b1 },
							u2: { data: state.boards.u1_b1 },
							guest: { data: null }
						}
					);
				});
			});
		});
	});
});
