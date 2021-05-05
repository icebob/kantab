"use strict";

const _ = require("lodash");
const { ServiceBroker } = require("moleculer");
const AccountsService = require("../../services/accounts.service");
const ConfigService = require("../../services/config.service");
const E = require("moleculer").Errors;

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
		broker.createService(ConfigService);

		// Tested service
		broker.createService(AccountsService, { version: null });

		beforeAll(() => broker.start());
		afterAll(() => broker.stop());

		it("check permissions", async () => {
			expect(broker.findNextActionEndpoint("accounts.create").action.visibility).toBe(
				"protected"
			);
			expect(broker.findNextActionEndpoint("accounts.find").action.visibility).toBe(
				"protected"
			);
			expect(broker.findNextActionEndpoint("accounts.count").action.visibility).toBe(
				"protected"
			);
			expect(broker.findNextActionEndpoint("accounts.list").action.visibility).toBe(
				"protected"
			);
			expect(broker.findNextActionEndpoint("accounts.get").action.visibility).toBe(
				"protected"
			);
			expect(broker.findNextActionEndpoint("accounts.resolve").action.visibility).toBe(
				"protected"
			);
			expect(broker.findNextActionEndpoint("accounts.update").action.visibility).toBe(
				"protected"
			);
			expect(broker.findNextActionEndpoint("accounts.remove").action.visibility).toBe(
				"protected"
			);
		});
	});
});
