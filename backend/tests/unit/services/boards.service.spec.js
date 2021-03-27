"use strict";

const { ServiceBroker, Context } = require("moleculer");
const TestService = require("../../../services/boards.service");
const ConfigService = require("../../../services/config.service");
const E = require("moleculer").Errors;

const FindEntityMiddleware = require("../../../middlewares/find-entity.middleware");
//const CheckPermissionsMiddleware = require("../../../middlewares/CheckPermissions");

describe("Test Boards service", () => {
	let broker = new ServiceBroker({
		logger: false,
		middlewares: [
			FindEntityMiddleware
			//CheckPermissionsMiddleware
		]
	});

	// Config service
	broker.createService(ConfigService);
	broker.createService({ name: "accounts", version: 1 }); // Mock in case of dependency

	// Boards service
	const service = broker.createService(TestService, {});

	beforeAll(() => broker.start());
	afterAll(() => broker.stop());

	it("check permissions", () => {
		expect(broker.findNextActionEndpoint("v1.boards.create").action.permissions).toEqual([
			"boards.create"
		]);
		expect(broker.findNextActionEndpoint("v1.boards.list").action.permissions).toEqual([
			"boards.read"
		]);
		expect(broker.findNextActionEndpoint("v1.boards.find").action.permissions).toEqual([
			"boards.read"
		]);
		expect(broker.findNextActionEndpoint("v1.boards.get").action.permissions).toEqual([
			"boards.read",
			"$owner"
		]);
		expect(broker.findNextActionEndpoint("v1.boards.update").action.permissions).toEqual([
			"administrator",
			"$owner"
		]);
		expect(broker.findNextActionEndpoint("v1.boards.remove").action.permissions).toEqual([
			"administrator",
			"$owner"
		]);
	});
});
