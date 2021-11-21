"use strict";

const { ServiceBroker } = require("moleculer");
const TestService = require("../../services/config.service");
const E = require("moleculer").Errors;
const AsyncContextMiddleware = require("../../middlewares/async-context.middleware");

describe("Test Configuration service", () => {
	let broker = new ServiceBroker({ logger: false, middlewares: [AsyncContextMiddleware] });
	const service = broker.createService(TestService, {
		version: null,
		settings: {
			defaultConfig: {
				"foo.bar": "John",
				"foo.bar.baz": 123,
				"foo.baz.bar": true
			}
		}
	});

	beforeAll(() => broker.start());
	afterAll(() => broker.stop());

	describe("Test 'migrateConfig' method", () => {
		let original;

		beforeAll(async () => {
			original = await broker.call("config.get", { key: "**" });
		});

		it("should contain all configuration with default values", async () => {
			expect(original.length).toBe(Object.keys(service.settings.defaultConfig).length);
			expect(original).toEqual(
				expect.arrayContaining([
					{
						key: "foo.bar",
						value: "John",
						isDefault: true
					},
					{
						key: "foo.bar.baz",
						value: 123,
						isDefault: true
					},
					{
						key: "foo.baz.bar",
						value: true,
						isDefault: true
					}
				])
			);

			Object.keys(service.settings.defaultConfig).forEach(key => {
				const item = original.find(o => o.key == key);
				expect(item).toEqual({
					key,
					value: service.settings.defaultConfig[key],
					isDefault: true
				});
			});
		});

		it("should do nothing", async () => {
			await broker.call("config.migrate");

			const res = await broker.call("config.get", { key: "**" });
			expect(res.length).toBe(original.length);
		});

		it("should change default value", async () => {
			service.settings.defaultConfig["foo.bar"] = "Jack";

			await broker.call("config.migrate");

			const res = await broker.call("config.get", { key: "foo.bar" });
			expect(res).toEqual({
				key: "foo.bar",
				value: "Jack",
				isDefault: true
			});
		});

		it("should add new config with default value", async () => {
			service.settings.defaultConfig["new.config"] = 9999;

			await broker.call("config.migrate");

			const res = await broker.call("config.get", { key: "new.config" });
			expect(res).toEqual({
				key: "new.config",
				value: 9999,
				isDefault: true
			});
		});
	});

	describe("Test 'config.get' action", () => {
		it("should return with all configuration", async () => {
			const res = await broker.call("config.get", { key: "**" });
			expect(res.length).toBe(Object.keys(service.settings.defaultConfig).length);
			expect(res).toEqual(
				expect.arrayContaining([
					{
						key: "foo.bar",
						value: "Jack",
						isDefault: true
					},
					{
						key: "foo.bar.baz",
						value: 123,
						isDefault: true
					},
					{
						key: "foo.baz.bar",
						value: true,
						isDefault: true
					}
				])
			);
		});

		it("should return with single config", async () => {
			expect(await broker.call("config.get", { key: "foo.bar.baz" })).toEqual({
				key: "foo.bar.baz",
				value: 123,
				isDefault: true
			});
		});

		it("should return with multiple config", async () => {
			expect(await broker.call("config.get", { key: ["foo.bar.baz", "foo.bar"] })).toEqual([
				{
					key: "foo.bar.baz",
					value: 123,
					isDefault: true
				},
				{
					key: "foo.bar",
					value: "Jack",
					isDefault: true
				}
			]);
		});

		it("should return with multiple config with pattern", async () => {
			expect(await broker.call("config.get", { key: "foo.**" })).toEqual(
				expect.arrayContaining([
					{
						key: "foo.bar",
						value: "Jack",
						isDefault: true
					},
					{
						key: "foo.bar.baz",
						value: 123,
						isDefault: true
					},
					{
						key: "foo.baz.bar",
						value: true,
						isDefault: true
					}
				])
			);
		});

		it("should return with empty array", async () => {
			expect(await broker.call("config.get", { key: [] })).toEqual([]);
		});

		it("should return with error", async () => {
			expect.assertions(3);
			try {
				await broker.call("config.get");
			} catch (e) {
				expect(e).toBeInstanceOf(E.ValidationError);
				expect(e.type).toBe("VALIDATION_ERROR");
				expect(e.data).toEqual([
					{
						action: "config.get",
						actual: undefined,
						field: "key",
						message: "The 'key' field is required.",
						nodeID: broker.nodeID,
						type: "required"
					}
				]);
			}
		});
	});

	describe("Test 'config.set' action", () => {
		jest.spyOn(broker, "broadcast");

		it("should not overwrite default value", async () => {
			broker.broadcast.mockClear();
			const res = await broker.call("config.set", { key: "foo.bar.baz", value: 123 });
			expect(res).toEqual({
				key: "foo.bar.baz",
				value: 123,
				isDefault: true
			});

			expect(broker.broadcast).toHaveBeenCalledTimes(0);
		});

		it("should overwrite default value", async () => {
			broker.broadcast.mockClear();

			const res = await broker.call("config.set", { key: "foo.bar.baz", value: 555 });
			expect(res).toEqual({
				key: "foo.bar.baz",
				value: 555,
				isDefault: false
			});

			expect(broker.broadcast).toHaveBeenCalledTimes(3);
			expect(broker.broadcast).toHaveBeenCalledWith("config.changed", res, expect.anything());
		});

		it("should create & return the new config", async () => {
			broker.broadcast.mockClear();

			const res = await broker.call("config.set", { key: "test.key1", value: "value1" });
			expect(res).toEqual({
				key: "test.key1",
				value: "value1",
				isDefault: false
			});
			expect(broker.broadcast).toHaveBeenCalledTimes(3);
			expect(broker.broadcast).toHaveBeenCalledWith("config.changed", res, expect.anything());
		});

		it("should modify the new config", async () => {
			broker.broadcast.mockClear();

			const res = await broker.call("config.set", {
				key: "test.key1",
				value: "modified1"
			});
			expect(res).toEqual({
				key: "test.key1",
				value: "modified1",
				isDefault: false
			});

			expect(broker.broadcast).toHaveBeenCalledTimes(3);
			expect(broker.broadcast).toHaveBeenCalledWith("config.changed", res, expect.anything());
		});

		it("should modify multiple configs", async () => {
			broker.broadcast.mockClear();

			const res = await broker.call("config.set", [
				{ key: "test.key1", value: "multi1" },
				{ key: "test.key2", value: "multi2" },
				{ key: "test.key3", value: "multi3" }
			]);
			expect(res).toEqual([
				{
					key: "test.key1",
					value: "multi1",
					isDefault: false
				},
				{
					key: "test.key2",
					value: "multi2",
					isDefault: false
				},
				{
					key: "test.key3",
					value: "multi3",
					isDefault: false
				}
			]);

			expect(broker.broadcast).toHaveBeenCalledTimes(9);
			expect(broker.broadcast).toHaveBeenCalledWith(
				"config.changed",
				res[0],
				expect.anything()
			);
			expect(broker.broadcast).toHaveBeenCalledWith(
				"config.changed",
				res[1],
				expect.anything()
			);
			expect(broker.broadcast).toHaveBeenCalledWith(
				"config.changed",
				res[2],
				expect.anything()
			);
		});
	});
});
