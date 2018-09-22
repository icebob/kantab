"use strict";

const { ServiceBroker, Context } = require("moleculer");
const TestService = require("../../../services/accounts.service");
const ConfigService = require("../../../services/config.service");
const E = require("moleculer").Errors;

process.env.JWT_SECRET = "kantab-secret-test";

describe("Test Accounts service", () => {
	let broker = new ServiceBroker({ logger: false });

	// Config service
	broker.createService(ConfigService);

	// Accounts service
	const service = broker.createService(TestService, {});
	service.sendMail = jest.fn(() => Promise.resolve());

	beforeAll(() => broker.start());
	afterAll(() => broker.stop());

	it("check action visibilities", async () => {
		expect(broker.findNextActionEndpoint("v1.accounts.create").action.visibility).toBe("protected");
		expect(broker.findNextActionEndpoint("v1.accounts.list").action.visibility).toBe("protected");
		expect(broker.findNextActionEndpoint("v1.accounts.find").action.visibility).toBe("protected");
		expect(broker.findNextActionEndpoint("v1.accounts.get").action.visibility).toBe("protected");
		expect(broker.findNextActionEndpoint("v1.accounts.update").action.visibility).toBe("protected");
		expect(broker.findNextActionEndpoint("v1.accounts.remove").action.visibility).toBe("protected");
	});

	describe("Test 'register' action", () => {

		const user1 = {
			username: "user1",
			password: "password1",
			email: "user1@kantab.io",
			firstName: "User",
			lastName: "One",
			avatar: "https://s3.amazonaws.com/uifaces/faces/twitter/ekvium/128.jpg"
		};

		const user2 = {
			username: "user2",
			password: "password2",
			email: "user2@kantab.io",
			firstName: "User",
			lastName: "Two"
		};

		const user3 = {
			username: "user3",
			email: "user3@kantab.io",
			firstName: "User",
			lastName: "Three"
		};

		it("should throw error if signup is disabled", async () => {
			service.config["accounts.signup.enabled"] = false;

			expect.assertions(4);
			try {
				await broker.call("v1.accounts.register", user1);
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("ERR_SIGNUP_DISABLED");
			}

			service.config["accounts.signup.enabled"] = true;
		});

		it("should throw error if email is exist", async () => {
			expect.assertions(4);
			try {
				await broker.call("v1.accounts.register", Object.assign({}, user1, { email: "test@kantab.io" }));
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("ERR_EMAIL_EXISTS");
			}
		});

		it("should throw error if username is not exist but username is enabled", async () => {
			service.config["accounts.username.enabled"] = true;

			expect.assertions(4);
			try {
				await broker.call("v1.accounts.register", Object.assign({}, user1, { username: null }));
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("ERR_USERNAME_EMPTY");
			}
		});

		it("should throw error if username is exist", async () => {
			service.config["accounts.username.enabled"] = true;

			expect.assertions(4);
			try {
				await broker.call("v1.accounts.register", Object.assign({}, user1, { username: "test" }));
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("ERR_USERNAME_EXISTS");
			}
		});

		it("should create new user with avatar, password without verification", async () => {
			service.config["accounts.verification.enabled"] = false;

			const res = await broker.call("v1.accounts.register", user1);

			expect(res).toEqual({
				_id: expect.any(String),
				email: "user1@kantab.io",
				username: "user1",
				firstName: "User",
				lastName: "One",
				roles: ["user"],
				plan: "free",
				socialLinks: {},
				createdAt: expect.any(Number),
				verified: true,
				status: 1,
				avatar: "https://s3.amazonaws.com/uifaces/faces/twitter/ekvium/128.jpg",
				token: expect.any(String)
			});

			expect(service.sendMail).toHaveBeenCalledTimes(1);
			expect(service.sendMail).toHaveBeenCalledWith(expect.any(Context), res, "welcome");
		});

		it("should create new user without avatar with verification", async () => {
			service.sendMail.mockClear();
			service.config["accounts.verification.enabled"] = true;

			const res = await broker.call("v1.accounts.register", user2);

			expect(res).toEqual({
				_id: expect.any(String),
				email: "user2@kantab.io",
				username: "user2",
				firstName: "User",
				lastName: "Two",
				roles: ["user"],
				plan: "free",
				socialLinks: {},
				createdAt: expect.any(Number),
				verified: false,
				status: 1,
				avatar: "https://gravatar.com/avatar/6a99f787601d736a0d1b79b13a252f9a?s=64&d=robohash"
			});

			expect(service.sendMail).toHaveBeenCalledTimes(1);
			expect(service.sendMail).toHaveBeenCalledWith(expect.any(Context), res, "activate", { token: expect.any(String) });
		});

		it("should throw error if no password & passwordless is not enabled", async () => {
			service.sendMail.mockClear();
			service.config["accounts.passwordless.enabled"] = false;

			expect.assertions(4);
			try {
				await broker.call("v1.accounts.register", user3);
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("ERR_PASSWORD_EMPTY");
			}
		});

		it("should create new passwordless user", async () => {
			service.sendMail.mockClear();
			service.config["accounts.passwordless.enabled"] = true;

			const res = await broker.call("v1.accounts.register", user3);

			expect(res).toEqual({
				_id: expect.any(String),
				email: "user3@kantab.io",
				username: "user3",
				firstName: "User",
				lastName: "Three",
				passwordless: true,
				roles: ["user"],
				plan: "free",
				socialLinks: {},
				createdAt: expect.any(Number),
				verified: false,
				status: 1,
				avatar: "https://gravatar.com/avatar/9b846cdc5f5eb743c4ef2c556a822d22?s=64&d=robohash"
			});

			expect(service.sendMail).toHaveBeenCalledTimes(1);
			expect(service.sendMail).toHaveBeenCalledWith(expect.any(Context), res, "activate", { token: expect.any(String) });
		});

	});

});
