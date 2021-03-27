"use strict";

const { ServiceBroker, Context } = require("moleculer");
const TestService = require("../../../services/acl.service");
const ConfigService = require("../../../services/config.service");
const E = require("moleculer").Errors;
const C = require("../../../constants");

const FindEntityMiddleware = require("../../../middlewares/find-entity.middleware");
//const CheckPermissionsMiddleware = require("../../../middlewares/CheckPermissions");

describe("Test ACL service", () => {
	describe("Test common methods", () => {
		let broker = new ServiceBroker({
			logger: false,
			middlewares: [
				FindEntityMiddleware
				//CheckPermissionsMiddleware
			]
		});

		// Config service
		broker.createService(ConfigService);

		// ACL service
		const service = broker.createService(TestService, {});

		beforeAll(() => broker.start());
		afterAll(() => broker.stop());

		it.skip("check permissions", async () => {
			expect(broker.findNextActionEndpoint("v1.acl.create").action.permissions).toBe(
				"protected"
			);
			expect(broker.findNextActionEndpoint("v1.acl.list").action.permissions).toBe(
				"protected"
			);
			expect(broker.findNextActionEndpoint("v1.acl.find").action.permissions).toBe(
				"protected"
			);
			expect(broker.findNextActionEndpoint("v1.acl.get").action.permissions).toBe(
				"protected"
			);
			expect(broker.findNextActionEndpoint("v1.acl.update").action.permissions).toBe(
				"protected"
			);
			expect(broker.findNextActionEndpoint("v1.acl.remove").action.permissions).toBe(
				"protected"
			);
		});

		describe("Test 'assignPermission' method", () => {
			const role = {
				_id: 123,
				name: "moderator",
				permissions: ["boards.create"]
			};

			it("should assign permission to role", async () => {
				service.adapter.updateById = jest.fn(async () => role);
				const res = await service.assignPermission(role, "boards.remove");

				expect(res).toBe(role);

				expect(service.adapter.updateById).toHaveBeenCalledTimes(1);
				expect(service.adapter.updateById).toHaveBeenCalledWith(123, {
					$addToSet: {
						permissions: "boards.remove"
					},
					$set: {
						updatedAt: expect.any(Number)
					}
				});
			});

			it("should not assign available permission to role", async () => {
				service.adapter.updateById = jest.fn(async () => role);
				const res = await service.assignPermission(role, "boards.create");

				expect(res).toBe(role);

				expect(service.adapter.updateById).toHaveBeenCalledTimes(0);
			});
		});

		describe("Test 'revokePermission' method", () => {
			const role = {
				_id: 123,
				name: "moderator",
				permissions: ["boards.create"]
			};

			it("should not revoke available permission to role", async () => {
				service.adapter.updateById = jest.fn(async () => role);
				const res = await service.revokePermission(role, "boards.remove");

				expect(res).toBe(role);

				expect(service.adapter.updateById).toHaveBeenCalledTimes(0);
			});

			it("should revoke permission to role", async () => {
				service.adapter.updateById = jest.fn(async () => role);
				const res = await service.revokePermission(role, "boards.create");

				expect(res).toBe(role);

				expect(service.adapter.updateById).toHaveBeenCalledTimes(1);
				expect(service.adapter.updateById).toHaveBeenCalledWith(123, {
					$pull: {
						permissions: "boards.create"
					},
					$set: {
						updatedAt: expect.any(Number)
					}
				});
			});
		});

		describe("Test 'syncPermissions' method", () => {
			const role = {
				_id: 123,
				name: "moderator",
				permissions: ["boards.create"]
			};

			it("should revoke permission to role", async () => {
				service.adapter.updateById = jest.fn(async () => role);
				const res = await service.syncPermissions(role, ["boards.remove", "users.list"]);

				expect(res).toBe(role);

				expect(service.adapter.updateById).toHaveBeenCalledTimes(1);
				expect(service.adapter.updateById).toHaveBeenCalledWith(123, {
					$set: {
						permissions: ["boards.remove", "users.list"]
					}
				});
			});
		});

		describe("Test 'getPermissions' method", () => {
			const roles = {
				admin: {
					inherits: ["boardRead", "boardWrite", "userFull"]
				},

				boardRead: {
					permissions: ["boards.list", "boards.get"],
					inherits: []
				},

				boardWrite: {
					permissions: ["boards.create", "boards.list", "boards.update", "boards.remove"],
					inherits: ["empty"]
				},

				empty: {},

				userRead: {
					permissions: ["users.list", "users.get"]
				},

				userWrite: {
					permissions: ["users.list", "users.update", "users.remove"]
				},

				userFull: {
					inherits: ["userRead", "userWrite"]
				}
			};

			service.adapter.find = jest.fn(async ({ query }) =>
				Promise.resolve(query.name["$in"].map(name => roles[name]))
			);

			it("should return permissions of role", async () => {
				const res = await service.getPermissions("userRead");

				expect(res).toEqual(["users.list", "users.get"]);

				expect(service.adapter.find).toHaveBeenCalledTimes(1);
				expect(service.adapter.find).toHaveBeenCalledWith({
					query: { name: { $in: ["userRead"] } }
				});
			});

			it("should return multiple merged permissions of roles", async () => {
				service.adapter.find.mockClear();

				const res = await service.getPermissions(["userRead", "userWrite"]);

				expect(res).toEqual(["users.list", "users.get", "users.update", "users.remove"]);

				expect(service.adapter.find).toHaveBeenCalledTimes(1);
				expect(service.adapter.find).toHaveBeenCalledWith({
					query: { name: { $in: ["userRead", "userWrite"] } }
				});
			});

			it("should return nested merged permissions of roles", async () => {
				service.adapter.find.mockClear();

				const res = await service.getPermissions("admin");

				expect(res).toEqual([
					"boards.list",
					"boards.get",
					"boards.create",
					"boards.update",
					"boards.remove",
					"users.list",
					"users.get",
					"users.update",
					"users.remove"
				]);

				expect(service.adapter.find).toHaveBeenCalledTimes(4);
				expect(service.adapter.find).toHaveBeenCalledWith({
					query: { name: { $in: ["admin"] } }
				});
				expect(service.adapter.find).toHaveBeenCalledWith({
					query: { name: { $in: ["boardRead", "boardWrite", "userFull"] } }
				});
				expect(service.adapter.find).toHaveBeenCalledWith({
					query: { name: { $in: ["empty"] } }
				});
				expect(service.adapter.find).toHaveBeenCalledWith({
					query: { name: { $in: ["userRead", "userWrite"] } }
				});
			});
		});

		describe("Test 'hasRole' method", () => {
			it("should find the role 1", async () => {
				service.adapter.find = jest.fn(async () => Promise.resolve([]));

				const res = await service.hasRole("admin", "admin");
				expect(res).toBe(true);
			});

			it("should find the role 2", async () => {
				const res = await service.hasRole(["user", "admin"], "admin");
				expect(res).toBe(true);
			});

			it("should not find the role 1", async () => {
				const res = await service.hasRole("admin", "user");
				expect(res).toBe(false);
			});

			it("should not find the role 2", async () => {
				const res = await service.hasRole(["admin", "moderator"], "user");
				expect(res).toBe(false);
			});

			it("should not find the role 3", async () => {
				const res = await service.hasRole([], "admin");
				expect(res).toBe(false);
			});
		});

		describe("Test 'hasRole' method with inherits", () => {
			it("should find the role", async () => {
				service.adapter.find = jest.fn(async () =>
					Promise.resolve([{ inherits: ["user", "board-admin"] }])
				);
				const res = await service.hasRole(["moderator"], "user");
				expect(res).toBe(true);
			});
		});

		describe("Test 'can' method", () => {
			it("should find the permission", async () => {
				service.getPermissions = jest.fn(async () => ["boards.create"]);
				const res = await service.can("admin", "boards.create");

				expect(res).toBe(true);
				expect(service.getPermissions).toHaveBeenCalledTimes(1);
				expect(service.getPermissions).toHaveBeenCalledWith(["admin"]);
			});

			it("should find the permission", async () => {
				service.getPermissions = jest.fn(async () => ["boards.create"]);
				const res = await service.can(["user", "admin"], "boards.create");

				expect(res).toBe(true);
				expect(service.getPermissions).toHaveBeenCalledTimes(1);
				expect(service.getPermissions).toHaveBeenCalledWith(["user", "admin"]);
			});

			it("should not find the role", async () => {
				service.getPermissions = jest.fn(async () => ["boards.create"]);
				const res = await service.can(["admin"], "boards.remove");

				expect(res).toBe(false);
				expect(service.getPermissions).toHaveBeenCalledTimes(1);
				expect(service.getPermissions).toHaveBeenCalledWith(["admin"]);
			});

			it("should find with wildcard", async () => {
				service.getPermissions = jest.fn(async () => ["boards.*"]);
				const res = await service.can(["user", "admin"], "boards.create");

				expect(res).toBe(true);
				expect(service.getPermissions).toHaveBeenCalledTimes(1);
				expect(service.getPermissions).toHaveBeenCalledWith(["user", "admin"]);
			});

			it("should find with wildcard", async () => {
				service.getPermissions = jest.fn(async () => ["**"]);
				const res = await service.can("user", "boards.remove");

				expect(res).toBe(true);
				expect(service.getPermissions).toHaveBeenCalledTimes(1);
				expect(service.getPermissions).toHaveBeenCalledWith(["user"]);
			});
		});

		describe("Test 'canAtLeast' method", () => {
			it("should find the permission", async () => {
				service.getPermissions = jest.fn(async () => ["boards.create"]);
				const res = await service.canAtLeast("admin", ["boards.create"]);

				expect(res).toBe(true);
				expect(service.getPermissions).toHaveBeenCalledTimes(1);
				expect(service.getPermissions).toHaveBeenCalledWith(["admin"]);
			});

			it("should find the permission", async () => {
				service.getPermissions = jest.fn(async () => ["boards.create"]);
				const res = await service.canAtLeast(
					["user", "admin"],
					["boards.insert", "boards.create"]
				);

				expect(res).toBe(true);
				expect(service.getPermissions).toHaveBeenCalledTimes(1);
				expect(service.getPermissions).toHaveBeenCalledWith(["user", "admin"]);
			});

			it("should not find the role", async () => {
				service.getPermissions = jest.fn(async () => ["boards.create"]);
				const res = await service.canAtLeast(
					["admin"],
					["boards.insert", "boards.insertMany"]
				);

				expect(res).toBe(false);
				expect(service.getPermissions).toHaveBeenCalledTimes(1);
				expect(service.getPermissions).toHaveBeenCalledWith(["admin"]);
			});

			it("should find with wildcard", async () => {
				service.getPermissions = jest.fn(async () => ["boards.*"]);
				const res = await service.canAtLeast(["user", "admin"], ["boards.insert"]);

				expect(res).toBe(true);
				expect(service.getPermissions).toHaveBeenCalledTimes(1);
				expect(service.getPermissions).toHaveBeenCalledWith(["user", "admin"]);
			});

			it("should find with wildcard", async () => {
				service.getPermissions = jest.fn(async () => ["**"]);
				const res = await service.canAtLeast("user", ["boards.remove"]);

				expect(res).toBe(true);
				expect(service.getPermissions).toHaveBeenCalledTimes(1);
				expect(service.getPermissions).toHaveBeenCalledWith(["user"]);
			});
		});

		describe("Test 'hasAccess' method", () => {
			it("should call 'can' method", async () => {
				service.can = jest.fn(async () => false);
				service.hasRole = jest.fn(async () => false);

				await service.hasAccess("admin", ["boards.create"]);

				expect(service.can).toHaveBeenCalledTimes(1);
				expect(service.can).toHaveBeenCalledWith("admin", "boards.create");
			});

			it("should call 'can' method twice", async () => {
				service.can.mockClear();

				await service.hasAccess("admin", ["boards.create", "boards.insert"]);

				expect(service.can).toHaveBeenCalledTimes(2);
				expect(service.can).toHaveBeenCalledWith("admin", "boards.create");
				expect(service.can).toHaveBeenCalledWith("admin", "boards.insert");
			});

			it("should call 'hasRole' method", async () => {
				service.hasRole.mockClear();

				await service.hasAccess("admin", ["moderator"]);

				expect(service.hasRole).toHaveBeenCalledTimes(1);
				expect(service.hasRole).toHaveBeenCalledWith("admin", "moderator");
			});

			it("should call 'hasRole' & 'can' methods", async () => {
				service.hasRole.mockClear();
				service.can.mockClear();

				await service.hasAccess("admin", ["administrator", "owner", "boards.remove"]);

				expect(service.hasRole).toHaveBeenCalledTimes(2);
				expect(service.hasRole).toHaveBeenCalledWith("admin", "administrator");
				expect(service.hasRole).toHaveBeenCalledWith("admin", "owner");

				expect(service.can).toHaveBeenCalledTimes(1);
				expect(service.can).toHaveBeenCalledWith("admin", "boards.remove");
			});
		});
	});
});
