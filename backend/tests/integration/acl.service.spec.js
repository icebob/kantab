"use strict";

const _ = require("lodash");
const { ServiceBroker } = require("moleculer");
const AclService = require("../../services/acl.service");
//const ConfigService = require("../../services/config.service");

const FindEntityMiddleware = require("../../middlewares/find-entity.middleware");
const CheckPermissionsMiddleware = require("../../middlewares/check-permissions.middleware");
const AsyncContextMiddleware = require("../../middlewares/async-context.middleware");

describe("Test Access-Control logic", () => {
	describe("Test ACL service actions", () => {
		const broker = new ServiceBroker({
			logger: false,
			middlewares: [FindEntityMiddleware, CheckPermissionsMiddleware, AsyncContextMiddleware]
		});

		// Config service
		//broker.createService(ConfigService);

		// ACL service
		broker.createService(AclService, { version: null });

		beforeAll(() => broker.start());
		afterAll(() => broker.stop());

		it("check permissions", async () => {
			expect(broker.findNextActionEndpoint("acl.create").action.visibility).toBe("protected");
			expect(broker.findNextActionEndpoint("acl.find").action.visibility).toBe("protected");
			expect(broker.findNextActionEndpoint("acl.count").action.visibility).toBe("protected");
			expect(broker.findNextActionEndpoint("acl.list").action.visibility).toBe("protected");
			expect(broker.findNextActionEndpoint("acl.get").action.visibility).toBe("protected");
			expect(broker.findNextActionEndpoint("acl.resolve").action.visibility).toBe(
				"protected"
			);
			expect(broker.findNextActionEndpoint("acl.update").action.visibility).toBe("protected");
			expect(broker.findNextActionEndpoint("acl.remove").action.visibility).toBe("protected");
		});

		it("should find two base roles after seeding", async () => {
			const res = await broker.call("acl.find");

			expect(res.length).toBe(2);
			expect(res).toEqual(
				expect.arrayContaining([
					{
						id: expect.any(String),
						key: "administrator",
						name: "System Administrator",
						permissions: ["**"],
						status: 1,
						createdAt: expect.any(Number)
					},
					{
						id: expect.any(String),
						key: "user",
						name: "Registered User",
						permissions: [
							"boards.create",
							"boards.read",
							"boards.update",
							"boards.remove",
							"cards.create"
						],
						status: 1,
						createdAt: expect.any(Number)
					}
				])
			);
		});

		const role = {
			key: "boss",
			name: "Boss-level role",
			permissions: ["user.list", "user.find"]
		};

		it("should create a new role", async () => {
			const res = await broker.call("acl.create", _.cloneDeep(role));

			expect(res).toEqual({
				...role,
				id: expect.any(String),
				status: 1,
				createdAt: expect.any(Number)
			});

			expect(await broker.call("acl.count")).toBe(3);
			role.id = res.id;
		});

		it("should assign a permission to a role", async () => {
			const res = await broker.call("acl.assignPermission", {
				id: role.id,
				permission: "user.create"
			});

			expect(res.permissions).toEqual(["user.list", "user.find", "user.create"]);
			expect(res.updatedAt).toBeDefined();
			role.updatedAt = res.updatedAt;
		});

		it("should not assign it again", async () => {
			const res = await broker.call("acl.assignPermission", {
				id: role.id,
				permission: "user.create"
			});

			expect(res.permissions).toEqual(["user.list", "user.find", "user.create"]);
			expect(res.updatedAt).toBeDefined();
			expect(res.updatedAt).toBeGreaterThanOrEqual(role.updatedAt);
		});

		it("should revoke a permission from a role", async () => {
			const res = await broker.call("acl.revokePermission", {
				id: role.id,
				permission: "user.create"
			});

			expect(res.permissions).toEqual(["user.list", "user.find"]);
			expect(res.updatedAt).toBeDefined();
			role.updatedAt = res.updatedAt;
		});

		it("should not revoke it again", async () => {
			const res = await broker.call("acl.revokePermission", {
				id: role.id,
				permission: "user.create"
			});

			expect(res.permissions).toEqual(["user.list", "user.find"]);
			expect(res.updatedAt).toBeDefined();
			expect(res.updatedAt).toBeGreaterThanOrEqual(role.updatedAt);
		});

		it("should sync permissions with a role", async () => {
			const res = await broker.call("acl.syncPermissions", {
				id: role.id,
				permissions: ["boards.create", "boards.update", "boards.remove"]
			});

			expect(res.permissions).toEqual(["boards.create", "boards.update", "boards.remove"]);
			expect(res.updatedAt).toBeDefined();
		});
	});

	describe("Test ACL can & hasAccess actions", () => {
		const broker = new ServiceBroker({
			logger: false,
			middlewares: [FindEntityMiddleware, CheckPermissionsMiddleware, AsyncContextMiddleware]
		});

		// Config service
		//broker.createService(ConfigService);

		// ACL service
		broker.createService(AclService, { version: null });

		beforeAll(async () => {
			await broker.start();

			await broker.call("acl.create", {
				key: "boards-reader",
				permissions: ["boards.list", "boards.get"]
			});

			await broker.call("acl.create", {
				key: "boards-writer",
				permissions: ["boards.create", "boards.update", "boards.remove"]
			});

			await broker.call("acl.create", {
				key: "boards-admin",
				inherits: ["boards-reader", "boards-writer"]
			});

			await broker.call("acl.create", {
				key: "users-admin",
				permissions: ["users.*"]
			});

			await broker.call("acl.create", {
				key: "manager",
				inherits: ["boards-admin", "users-admin"]
			});
		});
		afterAll(() => broker.stop());

		it("should have new 5 roles", async () => {
			const res = await broker.call("acl.find");

			expect(res.length).toBe(7);
		});

		describe("Test acl.can action", () => {
			it("should has good access for 'boards-reader'", async () => {
				expect(
					await broker.call("acl.can", {
						roles: ["boards-reader"],
						permission: "boards.list"
					})
				).toBe(true);
				expect(
					await broker.call("acl.can", {
						roles: ["boards-reader"],
						permission: "boards.get"
					})
				).toBe(true);
				expect(
					await broker.call("acl.can", {
						roles: ["boards-reader"],
						permission: "boards.create"
					})
				).toBe(false);
			});
			it("should has good access for 'boards-writer'", async () => {
				expect(
					await broker.call("acl.can", {
						roles: ["boards-writer"],
						permission: "boards.list"
					})
				).toBe(false);
				expect(
					await broker.call("acl.can", {
						roles: ["boards-writer"],
						permission: "boards.create"
					})
				).toBe(true);
			});
			it("should has good access for 'boards-admin'", async () => {
				expect(
					await broker.call("acl.can", {
						roles: ["boards-admin"],
						permission: "boards.list"
					})
				).toBe(true);
				expect(
					await broker.call("acl.can", {
						roles: ["boards-admin"],
						permission: "boards.create"
					})
				).toBe(true);
				expect(
					await broker.call("acl.can", {
						roles: ["boards-admin"],
						permission: "users.create"
					})
				).toBe(false);
			});
			it("should has good access for 'users-admin'", async () => {
				expect(
					await broker.call("acl.can", {
						roles: ["users-admin"],
						permission: "users.list"
					})
				).toBe(true);
				expect(
					await broker.call("acl.can", {
						roles: ["users-admin"],
						permission: "users.create"
					})
				).toBe(true);
				expect(
					await broker.call("acl.can", {
						roles: ["users-admin"],
						permission: "boards.create"
					})
				).toBe(false);
			});
			it("should has good access for 'manager'", async () => {
				expect(
					await broker.call("acl.can", { roles: ["manager"], permission: "users.list" })
				).toBe(true);
				expect(
					await broker.call("acl.can", { roles: ["manager"], permission: "users.create" })
				).toBe(true);
				expect(
					await broker.call("acl.can", {
						roles: ["manager"],
						permission: "boards.create"
					})
				).toBe(true);
			});
			it("should has good access for 'administrator'", async () => {
				expect(
					await broker.call("acl.can", {
						roles: ["administrator"],
						permission: "users.list"
					})
				).toBe(true);
				expect(
					await broker.call("acl.can", {
						roles: ["administrator"],
						permission: "users.create"
					})
				).toBe(true);
				expect(
					await broker.call("acl.can", {
						roles: ["administrator"],
						permission: "boards.create"
					})
				).toBe(true);
				expect(
					await broker.call("acl.can", {
						roles: ["administrator"],
						permission: "every.thing"
					})
				).toBe(true);
			});

			it("should find the good permissions with multiple roles", async () => {
				expect(
					await broker.call("acl.can", {
						roles: ["boards-reader", "boards-writer"],
						permission: "boards.list"
					})
				).toBe(true);
				expect(
					await broker.call("acl.can", {
						roles: ["boards-reader", "boards-writer"],
						permission: "boards.create"
					})
				).toBe(true);
				expect(
					await broker.call("acl.can", {
						roles: ["boards-reader", "boards-writer"],
						permission: "users.create"
					})
				).toBe(false);

				expect(
					await broker.call("acl.can", {
						roles: ["users-admin", "administrator"],
						permission: "boards.create"
					})
				).toBe(true);
				expect(
					await broker.call("acl.can", {
						roles: ["users-admin", "administrator"],
						permission: "every.thing"
					})
				).toBe(true);
			});
		});

		describe("Test acl.can action", () => {
			it("should find the good permissions with hasAccess action", async () => {
				expect(
					await broker.call("acl.hasAccess", {
						roles: ["boards-reader", "boards-writer"],
						permissions: ["boards.list"]
					})
				).toBe(true);

				expect(
					await broker.call("acl.hasAccess", {
						roles: ["boards-reader", "boards-writer"],
						permissions: ["boards.list", "users.create"]
					})
				).toBe(true);

				expect(
					await broker.call("acl.hasAccess", {
						roles: ["boards-reader", "boards-writer"],
						permissions: ["boards-reader", "users.create"]
					})
				).toBe(true);

				expect(
					await broker.call("acl.hasAccess", {
						roles: ["boards-reader", "boards-writer"],
						permissions: ["users-writer", "users.create"]
					})
				).toBe(false);

				expect(
					await broker.call("acl.hasAccess", {
						roles: ["boards-reader", "boards-writer", "users-admin"],
						permissions: ["users-writer", "users.create"]
					})
				).toBe(true);

				expect(
					await broker.call("acl.hasAccess", {
						roles: ["boards-reader", "boards-writer", "users-admin"],
						permissions: ["manager"]
					})
				).toBe(false);

				expect(
					await broker.call("acl.hasAccess", {
						roles: ["manager"],
						permissions: ["manager"]
					})
				).toBe(true);

				expect(
					await broker.call("acl.hasAccess", {
						roles: ["manager"],
						permissions: ["users-admin"]
					})
				).toBe(true);

				expect(
					await broker.call("acl.hasAccess", {
						roles: ["administrator"],
						permissions: ["manager"]
					})
				).toBe(false);
			});
		});
	});
});
