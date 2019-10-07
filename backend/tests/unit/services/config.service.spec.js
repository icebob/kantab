"use strict";

const { ServiceBroker } = require("moleculer");
const TestService = require("../../../services/config.service");
const E = require("moleculer").Errors;

describe("Test Configuration service", () => {
	let broker = new ServiceBroker({ logger: false });
	const service = broker.createService(TestService, {
		settings: {
			defaultConfig: {
				"foo.bar": "John",
				"foo.bar.baz": 123,
				"foo.baz.bar": true
			}
		}
	});

	beforeAll(() =>  broker.start());
	afterAll(() => broker.stop());

	describe("Test 'migrateConfig' method", () => {

		let original;

		beforeAll(async () => {
			original = await broker.call("v1.config.get", { key: "**" });
		});

		it("should contain all configuration with default values", async () => {
			expect(original.length).toBe(Object.keys(service.settings.defaultConfig).length);
			expect(original).toEqual(expect.arrayContaining([
				{ key:"foo.bar", value: "John", isDefault: true, createdAt: expect.any(Number), updatedAt: undefined },
				{ key:"foo.bar.baz", value: 123, isDefault: true, createdAt: expect.any(Number), updatedAt: undefined },
				{ key:"foo.baz.bar", value: true, isDefault: true, createdAt: expect.any(Number), updatedAt: undefined }
			]));

			Object.keys(service.settings.defaultConfig).forEach(key => {
				const item = original.find(o => o.key == key);
				expect(item).toEqual({
					key,
					value: service.settings.defaultConfig[key],
					isDefault: true,
					createdAt: expect.any(Number),
					updatedAt: undefined
				});
			});
		});

		it("should do nothing", async () => {
			await service.migrateConfig();

			const res = await broker.call("v1.config.get", { key: "**" });
			expect(res.length).toBe(original.length);
		});

		it("should change default value", async () => {
			service.settings.defaultConfig["foo.bar"] = "Jack";

			await service.migrateConfig();

			const res = await broker.call("v1.config.get", { key: "foo.bar" });
			expect(res).toEqual({
				key: "foo.bar",
				value: "Jack",
				isDefault: true,
				createdAt: expect.any(Number),
				updatedAt: expect.any(Number),
			});

		});

		it("should add new config with default value", async () => {
			service.settings.defaultConfig["new.config"] = 9999;

			await service.migrateConfig();

			const res = await broker.call("v1.config.get", { key: "new.config" });
			expect(res).toEqual({
				key: "new.config",
				value: 9999,
				isDefault: true,
				createdAt: expect.any(Number),
			});

		});

	});

	describe("Test 'config.get' action", () => {

		it("should return with all configuration", async () => {
			const res = await broker.call("v1.config.get", { key: "**" });
			expect(res.length).toBe(Object.keys(service.settings.defaultConfig).length);
			expect(res).toEqual(expect.arrayContaining([
				{ key:"foo.bar", value: "Jack", isDefault: true, createdAt: expect.any(Number), updatedAt: expect.any(Number) },
				{ key:"foo.bar.baz", value: 123, isDefault: true, createdAt: expect.any(Number), updatedAt: undefined },
				{ key:"foo.baz.bar", value: true, isDefault: true, createdAt: expect.any(Number), updatedAt: undefined }
			]));
		});

		it("should return with single config", async () => {
			expect(await broker.call("v1.config.get", { key: "foo.bar.baz" })).toEqual({
				key: "foo.bar.baz",
				value: 123,
				isDefault: true,
				createdAt: expect.any(Number)
			});
		});

		it("should return with multiple config", async () => {
			expect(await broker.call("v1.config.get", { key: ["foo.bar.baz", "foo.bar"] })).toEqual([
				{
					key: "foo.bar.baz",
					value: 123,
					isDefault: true,
					createdAt: expect.any(Number),
				},
				{
					key: "foo.bar",
					value: "Jack",
					isDefault: true,
					createdAt: expect.any(Number),
					updatedAt: expect.any(Number),
				},
			]);
		});

		it("should return with multiple config with pattern", async () => {
			expect(await broker.call("v1.config.get", { key: "foo.**" })).toEqual(expect.arrayContaining([
				{
					key: "foo.bar",
					value: "Jack",
					isDefault: true,
					createdAt: expect.any(Number),
					updatedAt: expect.any(Number),
				},
				{
					key: "foo.bar.baz",
					value: 123,
					isDefault: true,
					createdAt: expect.any(Number)
				},
				{
					key: "foo.baz.bar",
					value: true,
					isDefault: true,
					createdAt: expect.any(Number)
				},
			]));
		});

		it("should return with empty array", async () => {
			expect(await broker.call("v1.config.get", { key: [] })).toEqual([]);
		});

		it("should return with error", async () => {
			expect.assertions(3);
			try {
				await broker.call("v1.config.get");
			} catch (e) {
				expect(e).toBeInstanceOf(E.ValidationError);
				expect(e.message).toBe("Param 'key' must be defined.");
				expect(e.type).toBe("ERR_KEY_NOT_DEFINED");
			}
		});

	});

	describe("Test 'config.set' action", () => {

		let original;
		beforeAll(async () => {
			original = await broker.call("v1.config.get", { key: "foo.bar.baz" });
		});

		broker.broadcast = jest.fn();

		it("should not overwrite default value", async () => {
			const res = await broker.call("v1.config.set", { key: "foo.bar.baz", value: 123 });
			expect(res).toEqual({
				key: "foo.bar.baz",
				value: 123,
				isDefault: true,
				createdAt: original.createdAt,
			});

			expect(broker.broadcast).toHaveBeenCalledTimes(0);
		});

		it("should overwrite default value", async () => {
			broker.broadcast.mockClear();

			const res = await broker.call("v1.config.set", { key: "foo.bar.baz", value: 555 });
			expect(res).toEqual({
				key: "foo.bar.baz",
				value: 555,
				isDefault: false,
				createdAt: expect.any(Number),
				updatedAt: expect.any(Number),
			});

			expect(broker.broadcast).toHaveBeenCalledTimes(1);
			expect(broker.broadcast).toHaveBeenCalledWith("config.foo.bar.baz.changed", res);
		});

		it("should create & return the new config", async () => {
			broker.broadcast.mockClear();

			const res = await broker.call("v1.config.set", { key: "test.key1", value: "value1" });
			expect(res).toEqual({
				key: "test.key1",
				value: "value1",
				isDefault: false,
				createdAt: expect.any(Number),
			});
			expect(broker.broadcast).toHaveBeenCalledTimes(1);
			expect(broker.broadcast).toHaveBeenCalledWith("config.test.key1.changed", res);
		});

		it("should modify the new config", async () => {
			broker.broadcast.mockClear();

			const res = await broker.call("v1.config.set", { key: "test.key1", value: "modified1" });
			expect(res).toEqual({
				key: "test.key1",
				value: "modified1",
				isDefault: false,
				createdAt: expect.any(Number),
				updatedAt: expect.any(Number),
			});

			expect(broker.broadcast).toHaveBeenCalledTimes(1);
			expect(broker.broadcast).toHaveBeenCalledWith("config.test.key1.changed", res);
		});

		it("should modify multiple configs", async () => {
			broker.broadcast.mockClear();

			const res = await broker.call("v1.config.set", [
				{ key: "test.key1", value: "multi1" },
				{ key: "test.key2", value: "multi2" },
				{ key: "test.key3", value: "multi3" },
			]);
			expect(res).toEqual([
				{
					key: "test.key1",
					value: "multi1",
					isDefault: false,
					createdAt: expect.any(Number),
					updatedAt: expect.any(Number),
				},
				{
					key: "test.key2",
					value: "multi2",
					isDefault: false,
					createdAt: expect.any(Number),
				},
				{
					key: "test.key3",
					value: "multi3",
					isDefault: false,
					createdAt: expect.any(Number),
				},
			]);

			expect(broker.broadcast).toHaveBeenCalledTimes(3);
			expect(broker.broadcast).toHaveBeenCalledWith("config.test.key1.changed", res[0]);
			expect(broker.broadcast).toHaveBeenCalledWith("config.test.key2.changed", res[1]);
			expect(broker.broadcast).toHaveBeenCalledWith("config.test.key3.changed", res[2]);
		});

	});

});

