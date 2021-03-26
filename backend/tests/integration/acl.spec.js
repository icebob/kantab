"use strict";

const { ServiceBroker } = require("moleculer");
const AclService = require("../../services/acl.service");
const ConfigService = require("../../services/config.service");

const FindEntityMiddleware = require("../../middlewares/FindEntity");
const CheckPermissionsMiddleware = require("../../middlewares/CheckPermissions");

describe("Test Access-Control logic", () => {
	describe("Test ACL service CRUD actions", () => {
		let broker = new ServiceBroker({
			logger: false,
			middlewares: [FindEntityMiddleware, CheckPermissionsMiddleware]
		});

		// Config service
		broker.createService(ConfigService);

		// ACL service
		broker.createService(AclService, {});

		beforeAll(() => broker.start());
		afterAll(() => broker.stop());

		it("should find two base roles after seeding", async () => {
			const res = await broker.call("v1.acl.find");

			expect(res.length).toBe(2);
			expect(res).toEqual(
				expect.arrayContaining([
					{
						id: expect.any(String),
						createdAt: expect.any(Number),
						description: "System Administrator",
						name: "administrator",
						permissions: ["**"],
						status: 1
					},
					{
						id: expect.any(String),
						createdAt: expect.any(Number),
						description: "Registered User",
						name: "user",
						permissions: [
							"boards.create",
							"boards.read",
							"boards.update",
							"boards.remove",
							"cards.create"
						],
						status: 1
					}
				])
			);
		});

		const role = {
			name: "boss",
			description: "Boss-level role",
			permissions: ["user.list", "user.find"],
			status: 1,
			createdAt: Date.now()
		};

		it("should create a new role", async () => {
			const res = await broker.call("v1.acl.create", role);

			expect(res).toEqual({
				...role,
				id: expect.any(String)
			});

			expect(await broker.call("v1.acl.count")).toBe(3);
			role.id = res.id;
		});

		it("should assign a permission to a role", async () => {
			const res = await broker.call("v1.acl.assignPermission", {
				id: role.id,
				permission: "user.create"
			});

			expect(res.permissions).toEqual(["user.list", "user.find", "user.create"]);
			expect(res.updatedAt).toBeDefined();
			role.updatedAt = res.updatedAt;
		});

		it("should not assign it again", async () => {
			const res = await broker.call("v1.acl.assignPermission", {
				id: role.id,
				permission: "user.create"
			});

			expect(res.permissions).toEqual(["user.list", "user.find", "user.create"]);
			expect(res.updatedAt).toBeDefined();
			//expect(res.updatedAt).toBeGreaterThan(role.updatedAt);
		});

		it("should revoke a permission from a role", async () => {
			const res = await broker.call("v1.acl.revokePermission", {
				id: role.id,
				permission: "user.create"
			});

			expect(res.permissions).toEqual(["user.list", "user.find"]);
			expect(res.updatedAt).toBeDefined();
			role.updatedAt = res.updatedAt;
		});

		it("should not revoke it again", async () => {
			const res = await broker.call("v1.acl.revokePermission", {
				id: role.id,
				permission: "user.create"
			});

			expect(res.permissions).toEqual(["user.list", "user.find"]);
			expect(res.updatedAt).toBeDefined();
			//expect(res.updatedAt).toBeGreaterThan(role.updatedAt);
		});

		it("should sync permissions with a role", async () => {
			const res = await broker.call("v1.acl.syncPermissions", {
				id: role.id,
				permissions: ["boards.create", "boards.update", "boards.remove"]
			});

			expect(res.permissions).toEqual(["boards.create", "boards.update", "boards.remove"]);
			expect(res.updatedAt).toBeDefined();
		});
	});

	describe("Test ACL can & hasAccess actions", () => {
		let broker = new ServiceBroker({
			logger: false,
			middlewares: [FindEntityMiddleware, CheckPermissionsMiddleware]
		});

		// Config service
		broker.createService(ConfigService);

		// ACL service
		broker.createService(AclService, {});

		beforeAll(async () => {
			await broker.start();

			await broker.call("v1.acl.create", {
				name: "boards-reader",
				permissions: ["boards.list", "boards.get"]
			});

			await broker.call("v1.acl.create", {
				name: "boards-writer",
				permissions: ["boards.create", "boards.update", "boards.remove"]
			});

			await broker.call("v1.acl.create", {
				name: "boards-admin",
				inherits: ["boards-reader", "boards-writer"]
			});

			await broker.call("v1.acl.create", {
				name: "users-admin",
				permissions: ["users.*"]
			});

			await broker.call("v1.acl.create", {
				name: "manager",
				inherits: ["boards-admin", "users-admin"]
			});
		});
		afterAll(() => broker.stop());

		it("should have 5 roles", async () => {
			const res = await broker.call("v1.acl.find");

			expect(res.length).toBe(7);
		});

		it("should find the good permissions with single role", async () => {
			expect(
				await broker.call("v1.acl.can", {
					roles: ["boards-reader"],
					permission: "boards.list"
				})
			).toBe(true);
			expect(
				await broker.call("v1.acl.can", {
					roles: ["boards-reader"],
					permission: "boards.get"
				})
			).toBe(true);
			expect(
				await broker.call("v1.acl.can", {
					roles: ["boards-reader"],
					permission: "boards.create"
				})
			).toBe(false);

			expect(
				await broker.call("v1.acl.can", {
					roles: ["boards-writer"],
					permission: "boards.list"
				})
			).toBe(false);
			expect(
				await broker.call("v1.acl.can", {
					roles: ["boards-writer"],
					permission: "boards.create"
				})
			).toBe(true);

			expect(
				await broker.call("v1.acl.can", {
					roles: ["boards-admin"],
					permission: "boards.list"
				})
			).toBe(true);
			expect(
				await broker.call("v1.acl.can", {
					roles: ["boards-admin"],
					permission: "boards.create"
				})
			).toBe(true);
			expect(
				await broker.call("v1.acl.can", {
					roles: ["boards-admin"],
					permission: "users.create"
				})
			).toBe(false);

			expect(
				await broker.call("v1.acl.can", {
					roles: ["users-admin"],
					permission: "users.list"
				})
			).toBe(true);
			expect(
				await broker.call("v1.acl.can", {
					roles: ["users-admin"],
					permission: "users.create"
				})
			).toBe(true);
			expect(
				await broker.call("v1.acl.can", {
					roles: ["users-admin"],
					permission: "boards.create"
				})
			).toBe(false);

			expect(
				await broker.call("v1.acl.can", { roles: ["manager"], permission: "users.list" })
			).toBe(true);
			expect(
				await broker.call("v1.acl.can", { roles: ["manager"], permission: "users.create" })
			).toBe(true);
			expect(
				await broker.call("v1.acl.can", { roles: ["manager"], permission: "boards.create" })
			).toBe(true);

			expect(
				await broker.call("v1.acl.can", {
					roles: ["administrator"],
					permission: "users.list"
				})
			).toBe(true);
			expect(
				await broker.call("v1.acl.can", {
					roles: ["administrator"],
					permission: "users.create"
				})
			).toBe(true);
			expect(
				await broker.call("v1.acl.can", {
					roles: ["administrator"],
					permission: "boards.create"
				})
			).toBe(true);
			expect(
				await broker.call("v1.acl.can", {
					roles: ["administrator"],
					permission: "every.thing"
				})
			).toBe(true);
		});

		it("should find the good permissions with multiple roles", async () => {
			expect(
				await broker.call("v1.acl.can", {
					roles: ["boards-reader", "boards-writer"],
					permission: "boards.list"
				})
			).toBe(true);
			expect(
				await broker.call("v1.acl.can", {
					roles: ["boards-reader", "boards-writer"],
					permission: "boards.create"
				})
			).toBe(true);
			expect(
				await broker.call("v1.acl.can", {
					roles: ["boards-reader", "boards-writer"],
					permission: "users.create"
				})
			).toBe(false);

			expect(
				await broker.call("v1.acl.can", {
					roles: ["users-admin", "administrator"],
					permission: "boards.create"
				})
			).toBe(true);
			expect(
				await broker.call("v1.acl.can", {
					roles: ["users-admin", "administrator"],
					permission: "every.thing"
				})
			).toBe(true);
		});

		it("should find the good permissions with hasAccess action", async () => {
			expect(
				await broker.call("v1.acl.hasAccess", {
					roles: ["boards-reader", "boards-writer"],
					permissions: ["boards.list"]
				})
			).toBe(true);

			expect(
				await broker.call("v1.acl.hasAccess", {
					roles: ["boards-reader", "boards-writer"],
					permissions: ["boards.list", "users.create"]
				})
			).toBe(true);

			expect(
				await broker.call("v1.acl.hasAccess", {
					roles: ["boards-reader", "boards-writer"],
					permissions: ["boards-reader", "users.create"]
				})
			).toBe(true);

			expect(
				await broker.call("v1.acl.hasAccess", {
					roles: ["boards-reader", "boards-writer"],
					permissions: ["users-writer", "users.create"]
				})
			).toBe(false);

			expect(
				await broker.call("v1.acl.hasAccess", {
					roles: ["boards-reader", "boards-writer", "users-admin"],
					permissions: ["users-writer", "users.create"]
				})
			).toBe(true);

			expect(
				await broker.call("v1.acl.hasAccess", {
					roles: ["boards-reader", "boards-writer", "users-admin"],
					permissions: ["manager"]
				})
			).toBe(false);

			expect(
				await broker.call("v1.acl.hasAccess", {
					roles: ["manager"],
					permissions: ["manager"]
				})
			).toBe(true);

			expect(
				await broker.call("v1.acl.hasAccess", {
					roles: ["manager"],
					permissions: ["users-admin"]
				})
			).toBe(true);

			expect(
				await broker.call("v1.acl.hasAccess", {
					roles: ["administrator"],
					permissions: ["manager"]
				})
			).toBe(false);
		});
	});
});
