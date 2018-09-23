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

	// Mail service
	const mailSendMock = jest.fn(() => Promise.resolve(true));
	broker.createService({
		name: "mail",
		actions: {
			send: mailSendMock
		}
	});

	// Accounts service
	const service = broker.createService(TestService, {});

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

	describe("Test JWT methods", () => {
		it("should generate & verify a JWT", async () => {
			const payload = { id: 1, name: "John" };
			const token = await service.generateJWT(payload);

			expect(token).toEqual(expect.any(String));

			const res = await service.verifyJWT(token);

			expect(res).toEqual({
				...payload,
				exp: expect.any(Number),
				iat: expect.any(Number),
			});
		});

		it("should throw error if token is not valid", async () => {
			expect.assertions(4);
			try {
				await service.verifyJWT("123456");
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(401);
				expect(err.type).toBe("INVALID_TOKEN");
			}
		});

		it("should throw error if payload is not valid", async () => {
			expect.assertions(4);
			try {
				await service.generateJWT(null);
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerRetryableError);
				expect(err.name).toBe("MoleculerRetryableError");
				expect(err.code).toBe(500);
				expect(err.type).toBe("UNABLE_GENERATE_TOKEN");
			}
		});

		it("should generate JWT", async () => {
			const oldGenerateJWT = service.generateJWT;
			service.generateJWT = jest.fn();

			const user = { _id: 1, name: "John", status: 1 };
			await service.getToken(user);

			expect(service.generateJWT).toHaveBeenCalledTimes(1);
			expect(service.generateJWT).toHaveBeenCalledWith({ id: "1" });

			service.generateJWT = oldGenerateJWT;
		});
	});

	describe("Test common methods", () => {

		describe("Test sendMagicLink method", () => {

			let oldSendMail;
			beforeAll(() => oldSendMail = service.sendMail);
			afterAll(() => service.sendMail = oldSendMail);

			it("should generate passwordless token & call sendMail", async () => {
				service.sendMail = jest.fn();

				const ctx = new Context(broker);
				const user = { _id: 1, name: "John", email: "john@kantab.io" };

				ctx.call = jest.fn(async () => user);

				await service.sendMagicLink(ctx, user);

				expect(service.sendMail).toHaveBeenCalledTimes(1);
				expect(service.sendMail).toHaveBeenCalledWith(ctx, user, "magic-link", { token: expect.any(String) });

				expect(ctx.call).toHaveBeenCalledTimes(1);
				expect(ctx.call).toHaveBeenCalledWith("v1.accounts.update", {
					id: 1,
					passwordlessToken: expect.any(String),
					passwordlessTokenExpires: expect.any(Number)
				});
			});
		});

		describe("Test sendMail method", () => {
			it("should not call mail.send service", async () => {
				service.config["mail.enabled"] = false;

				const ctx = new Context(broker);

				const res = await service.sendMail(ctx, {}, "welcome", {});

				expect(res).toBe(false);
			});

			it("should call mail.send service", async () => {
				service.config["mail.enabled"] = true;

				const ctx = new Context(broker);
				const user = { _id: 1, name: "John", email: "john@kantab.io" };
				const data = { a: 5 };

				const res = await service.sendMail(ctx, user, "welcome", data);
				expect(res).toBe(true);
				expect(mailSendMock).toHaveBeenCalledTimes(1);
				const params = mailSendMock.mock.calls[0][0].params;
				expect(params).toEqual({
					data: {
						a: 5,
						site: { name: "KanBan", url: "http://localhost:4000" },
						user: { _id: 1, name: "John", email: "john@kantab.io" }
					},
					template: "welcome",
					to: "john@kantab.io"
				});
			});
		});

		describe("Test getUserByEmail method", () => {
			it("should call find action but return null if not found by email", async () => {
				const ctx = new Context(broker);
				ctx.call = jest.fn(async () => []);

				const res = await service.getUserByEmail(ctx, "john.doe@kantab.io");
				expect(res).toBeNull();

				expect(ctx.call).toHaveBeenCalledTimes(1);
				expect(ctx.call).toHaveBeenCalledWith("v1.accounts.find", { query: { email: "john.doe@kantab.io" }});
			});

			it("should call find action to find user by email", async () => {
				const ctx = new Context(broker);
				const user = { id: 1 };
				ctx.call = jest.fn(async () => [user]);

				const res = await service.getUserByEmail(ctx, "john.doe@kantab.io");

				expect(res).toBe(user);

				expect(ctx.call).toHaveBeenCalledTimes(1);
				expect(ctx.call).toHaveBeenCalledWith("v1.accounts.find", { query: { email: "john.doe@kantab.io" }});
			});
		});

		describe("Test getUserByUsername method", () => {
			it("should call find action but return null if not found by username", async () => {
				const ctx = new Context(broker);
				ctx.call = jest.fn(async () => []);

				const res = await service.getUserByUsername(ctx, "john1981");
				expect(res).toBeNull();

				expect(ctx.call).toHaveBeenCalledTimes(1);
				expect(ctx.call).toHaveBeenCalledWith("v1.accounts.find", { query: { username: "john1981" }});
			});

			it("should call find action to find user by username", async () => {
				const ctx = new Context(broker);
				const user = { id: 1 };
				ctx.call = jest.fn(async () => [user]);

				const res = await service.getUserByUsername(ctx, "john1981");

				expect(res).toBe(user);

				expect(ctx.call).toHaveBeenCalledTimes(1);
				expect(ctx.call).toHaveBeenCalledWith("v1.accounts.find", { query: { username: "john1981" }});
			});
		});
	});

	describe("Test 'register' & 'verify' action", () => {

		beforeAll(() => {
			service.sendMail = jest.fn(() => Promise.resolve());
		});

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

		let user3VerificationToken;

		it("should create new passwordless user", async () => {
			service.sendMail.mockClear();
			service.config["accounts.passwordless.enabled"] = true;
			service.config["accounts.defaultRoles"] = ["admin", "visitor"];
			service.config["accounts.defaultPlan"] = "premium";

			const res = await broker.call("v1.accounts.register", user3);

			expect(res).toEqual({
				_id: expect.any(String),
				email: "user3@kantab.io",
				username: "user3",
				firstName: "User",
				lastName: "Three",
				passwordless: true,
				roles: ["admin", "visitor"],
				plan: "premium",
				socialLinks: {},
				createdAt: expect.any(Number),
				verified: false,
				status: 1,
				avatar: "https://gravatar.com/avatar/9b846cdc5f5eb743c4ef2c556a822d22?s=64&d=robohash"
			});

			expect(service.sendMail).toHaveBeenCalledTimes(1);
			expect(service.sendMail).toHaveBeenCalledWith(expect.any(Context), res, "activate", { token: expect.any(String) });

			user3VerificationToken = service.sendMail.mock.calls[0][3].token;
		});

		it("should verify user3 with token", async () => {
			service.sendMail.mockClear();

			const res = await broker.call("v1.accounts.verify", { token: user3VerificationToken });
			expect(res).toEqual({
				token: expect.any(String)
			});

			expect(service.sendMail).toHaveBeenCalledTimes(1);
			expect(service.sendMail).toHaveBeenCalledWith(expect.any(Context), Object.assign({}, {
				_id: expect.any(String),
				email: "user3@kantab.io",
				username: "user3",
				firstName: "User",
				lastName: "Three",
				passwordless: true,
				roles: ["admin", "visitor"],
				plan: "premium",
				socialLinks: {},
				createdAt: expect.any(Number),
				verified: true, // !
				status: 1,
				avatar: "https://gravatar.com/avatar/9b846cdc5f5eb743c4ef2c556a822d22?s=64&d=robohash"
			}), "welcome");

			service.config["accounts.defaultRoles"] = ["user"];
			service.config["accounts.defaultPlan"] = "free";
		});

		it("should throw error if verification token is not exist", async () => {
			expect.assertions(4);
			try {
				await broker.call("v1.accounts.verify", { token: "12345678" });
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("INVALID_TOKEN");
			}
		});

	});

	describe("Test 'login' action", () => {

		beforeAll(() => {
			service.sendMail = jest.fn(() => Promise.resolve());
		});

		describe("with password", () => {

			const user = {
				username: "user4",
				password: "password4",
				email: "user4@kantab.io",
				firstName: "User",
				lastName: "Four"
			};

			let savedUser, verificationToken;

			beforeAll(async () => {
				service.sendMail.mockClear();
				service.config["accounts.verification.enabled"] = true;

				const regged = await broker.call("v1.accounts.register", user);
				savedUser = regged;
				verificationToken = service.sendMail.mock.calls[0][3].token;
			});

			it("should not logged in with non-exist account", async () => {
				expect.assertions(4);
				try {
					await broker.call("v1.accounts.login", { email: "no-user@kantab.io", password: "pass" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_USER_NOT_FOUND");
				}
			});

			it("should not logged in unverified account", async () => {
				expect.assertions(4);
				try {
					await broker.call("v1.accounts.login", { email: "user4@kantab.io", password: "password4" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_ACCOUNT_NOT_VERIFIED");
				}
			});

			it("verify account", async () => {
				await broker.call("v1.accounts.verify", { token: verificationToken });
			});

			it("should not logged in with wrong password", async () => {
				expect.assertions(4);
				try {
					await broker.call("v1.accounts.login", { email: "user4@kantab.io", password: "wrong-password" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_WRONG_PASSWORD");
				}
			});

			it("should logged with correct email & password", async () => {
				const res = await broker.call("v1.accounts.login", { email: "user4@kantab.io", password: "password4" });
				expect(res).toEqual({
					token: expect.any(String)
				});
			});

			it("should not logged in with username if this feature is disabled", async () => {
				expect.assertions(4);
				service.config["accounts.username.enabled"] = false;

				try {
					await broker.call("v1.accounts.login", { email: "user4", password: "password4" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_USER_NOT_FOUND");
				}
			});

			it("should logged with correct username & password", async () => {
				service.config["accounts.username.enabled"] = true;
				const res = await broker.call("v1.accounts.login", { email: "user4", password: "password4" });
				expect(res).toEqual({
					token: expect.any(String)
				});
			});

			it("should not logged in disabled account", async () => {
				expect.assertions(4);

				await broker.call("v1.accounts.disable", { id: savedUser._id });

				try {
					await broker.call("v1.accounts.login", { email: "user4@kantab.io", password: "password4" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_ACCOUNT_DISABLED");
				}

				await broker.call("v1.accounts.enable", { id: savedUser._id });
			});

			it("should not send magic-link email if no password and feature is disabled", async () => {
				service.config["accounts.passwordless.enabled"] = false;
				expect.assertions(4);
				try {
					await broker.call("v1.accounts.login", { email: "user4@kantab.io" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_PASSWORDLESS_DISABLED");
				}
			});

			it("should send magic-link email if no password and feature is enabled", async () => {
				service.config["accounts.passwordless.enabled"] = true;
				const oldSendMagicLink = service.sendMagicLink;
				service.sendMagicLink = jest.fn();
				const res = await broker.call("v1.accounts.login", { email: "user4@kantab.io" });
				expect(res).toEqual({
					email: "user4@kantab.io",
					passwordless: true
				});

				expect(service.sendMagicLink).toHaveBeenCalledTimes(1);
				expect(service.sendMagicLink).toHaveBeenCalledWith(expect.any(Context), Object.assign({}, savedUser, {
					password: expect.any(String),
					verified: true,
					verificationToken: null,
				}));

				service.sendMagicLink = oldSendMagicLink;
			});

		});

		describe("with passwordless", () => {

			const user = {
				username: "user5",
				email: "user5@kantab.io",
				firstName: "User",
				lastName: "Five"
			};

			let savedUser, verificationToken;
			let oldSendMagicLink;

			beforeAll(async () => {
				service.sendMail.mockClear();

				 oldSendMagicLink = service.sendMagicLink;
				service.sendMagicLink = jest.fn();

				service.config["accounts.passwordless.enabled"] = true;

				const regged = await broker.call("v1.accounts.register", user);
				savedUser = regged;
				verificationToken = service.sendMail.mock.calls[0][3].token;
			});

			afterAll(async () => {
				service.sendMagicLink = oldSendMagicLink;
			});

			it("should not logged in unverified account", async () => {
				expect.assertions(4);
				try {
					await broker.call("v1.accounts.login", { email: "user5@kantab.io" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_ACCOUNT_NOT_VERIFIED");
				}
			});

			it("verify account", async () => {
				await broker.call("v1.accounts.verify", { token: verificationToken });
			});

			it("should not logged in with password", async () => {
				expect.assertions(4);
				try {
					await broker.call("v1.accounts.login", { email: "user5@kantab.io", password: "some-password" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_PASSWORDLESS_WITH_PASSWORD");
				}
			});

			it("should not logged in if mail sending is disabled", async () => {
				service.config["mail.enabled"] = false;
				expect.assertions(4);
				try {
					await broker.call("v1.accounts.login", { email: "user5@kantab.io" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_PASSWORDLESS_UNAVAILABLE");
				}
				service.config["mail.enabled"] = true;
			});

			it("should not logged in if passwordless feature is disabled", async () => {
				service.config["accounts.passwordless.enabled"] = false;
				expect.assertions(4);
				try {
					await broker.call("v1.accounts.login", { email: "user5@kantab.io" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_PASSWORDLESS_DISABLED");
				}
				service.config["accounts.passwordless.enabled"] = true;
			});

			it("should send magic-link email if email is exist", async () => {
				service.sendMagicLink.mockClear();
				const res = await broker.call("v1.accounts.login", { email: "user5@kantab.io" });
				expect(res).toEqual({
					email: "user5@kantab.io",
					passwordless: true
				});

				expect(service.sendMagicLink).toHaveBeenCalledTimes(1);
				expect(service.sendMagicLink).toHaveBeenCalledWith(expect.any(Context), Object.assign({}, savedUser, {
					password: expect.any(String),
					verified: true,
					verificationToken: null,
				}));
			});

			it("should not logged in with username if this feature is disabled", async () => {
				expect.assertions(4);
				service.config["accounts.username.enabled"] = false;

				try {
					await broker.call("v1.accounts.login", { email: "user5", password: "password5" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_USER_NOT_FOUND");
				}
			});

			it("should send magic-link email if username is exist", async () => {
				service.config["accounts.username.enabled"] = true;
				service.sendMagicLink.mockClear();
				const res = await broker.call("v1.accounts.login", { email: "user5" });
				expect(res).toEqual({
					email: "user5@kantab.io",
					passwordless: true
				});

				expect(service.sendMagicLink).toHaveBeenCalledTimes(1);
				expect(service.sendMagicLink).toHaveBeenCalledWith(expect.any(Context), Object.assign({}, savedUser, {
					password: expect.any(String),
					verified: true,
					verificationToken: null,
				}));
			});

			it("should not logged in disabled account", async () => {
				expect.assertions(4);

				await broker.call("v1.accounts.disable", { id: savedUser._id });

				try {
					await broker.call("v1.accounts.login", { email: "user5@kantab.io" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_ACCOUNT_DISABLED");
				}
			});

		});
	});


	describe("Test 'socialLogin' action", () => {

		beforeAll(() => {
			service.sendMail = jest.fn(() => Promise.resolve());
		});

		describe("without logged in user", () => {

			const user = {
				username: "user6",
				password: "password6",
				email: "user6@kantab.io",
				firstName: "User",
				lastName: "Six"
			};

			let savedUser;

			beforeAll(async () => {
				service.sendMail.mockClear();
				service.config["accounts.verification.enabled"] = true;

				savedUser = await broker.call("v1.accounts.register", user);
			});

			it("should throw error if profile doesn't contain email", async () => {
				expect.assertions(4);
				try {
					await broker.call("v1.accounts.socialLogin", {
						provider: "google",
						profile: {
							socialID: 1000
						},
						accessToken: "token-1"
					});
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_NO_SOCIAL_EMAIL");
				}
			});

			it("should throw error if account is disabled", async () => {
				expect.assertions(4);
				await broker.call("v1.accounts.disable", { id: savedUser._id });
				try {
					await broker.call("v1.accounts.socialLogin", {
						provider: "google",
						profile: {
							socialID: 1000,
							email: "user6@kantab.io"
						},
						accessToken: "token-1"
					});
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ACCOUNT_DISABLED");
				}
				await broker.call("v1.accounts.enable", { id: savedUser._id });
			});

			it("should link the profile to an existing account", async () => {
				const res = await broker.call("v1.accounts.socialLogin", {
					provider: "google",
					profile: {
						socialID: 1000,
						email: "user6@kantab.io"
					},
					accessToken: "token-1"
				});

				expect(res).toEqual({
					...savedUser,
					socialLinks: {
						google: 1000
					},
					verified: true,
					token: expect.any(String)
				});
			});

			it("should not link again", async () => {
				const res = await broker.call("v1.accounts.socialLogin", {
					provider: "google",
					profile: {
						socialID: 1000,
						email: "user6@kantab.io"
					},
					accessToken: "token-1"
				});

				expect(res).toEqual({
					...savedUser,
					socialLinks: {
						google: 1000
					},
					verified: true,
					token: expect.any(String)
				});

				// TODO: check that link action is not called.
			});

			it("should link new provider to an existing account", async () => {
				const res = await broker.call("v1.accounts.socialLogin", {
					provider: "facebook",
					profile: {
						socialID: 2000,
						email: "user6@kantab.io"
					},
					accessToken: "token-1"
				});

				expect(res).toEqual({
					...savedUser,
					socialLinks: {
						google: 1000,
						facebook: 2000
					},
					verified: true,
					token: expect.any(String)
				});
			});

			it("should throw error if socialID not found & signup is disabled", async () => {
				service.config["accounts.signup.enabled"] = false;
				expect.assertions(4);
				try {
					await broker.call("v1.accounts.socialLogin", {
						provider: "google",
						profile: {
							socialID: 3000,
							email: "user7@kantab.io",
							firstName: "User",
							lastName: "Seven",
							avatar: "social-avatar.jpg"
						},
						accessToken: "token-100"
					});
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_SIGNUP_DISABLED");
				}
			});

			it("should create new user by social profile & link", async () => {
				service.config["accounts.signup.enabled"] = true;

				const res = await broker.call("v1.accounts.socialLogin", {
					provider: "google",
					profile: {
						socialID: 3000,
						email: "user7@kantab.io",
						firstName: "User",
						lastName: "Seven",
						avatar: "social-avatar.jpg"
					},
					accessToken: "token-100"
				});

				expect(res).toEqual({
					_id: expect.any(String),
					email: "user7@kantab.io",
					username: "user7",
					firstName: "User",
					lastName: "Seven",
					roles: ["user"],
					plan: "free",
					socialLinks: {
						google: 3000
					},
					createdAt: expect.any(Number),
					verified: true,
					status: 1,
					avatar: "social-avatar.jpg",
					token: expect.any(String)
				});
			});

		});

		describe("with logged in user", () => {

			const user = {
				username: "user8",
				password: "password8",
				email: "user8@kantab.io",
				firstName: "User",
				lastName: "Eight"
			};

			let savedUser;
			let meta;

			beforeAll(async () => {
				service.sendMail.mockClear();
				service.config["accounts.verification.enabled"] = false;

				savedUser = await broker.call("v1.accounts.register", user);
				meta = { user: { _id: savedUser._id } };
			});

			it("should throw error if socialID is assigned to another account", async () => {
				expect.assertions(4);
				try {
					await broker.call("v1.accounts.socialLogin", {
						provider: "google",
						profile: {
							socialID: 3000
						},
						accessToken: "token-8"
					}, { meta });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_SOCIAL_ACCOUNT_MISMATCH");
				}
			});

			it("should link & login with same user", async () => {
				const res = await broker.call("v1.accounts.socialLogin", {
					provider: "google",
					profile: {
						socialID: 4000
					},
					accessToken: "token-8"
				}, { meta });

				expect(res).toEqual({
					...savedUser,
					socialLinks: {
						google: 4000
					},
					verified: true,
					token: expect.any(String)
				});
			});

			it("should not link but login with same user", async () => {
				const res = await broker.call("v1.accounts.socialLogin", {
					provider: "google",
					profile: {
						socialID: 4000
					},
					accessToken: "token-8"
				}, { meta });

				expect(res).toEqual({
					...savedUser,
					socialLinks: {
						google: 4000
					},
					verified: true,
					token: expect.any(String)
				});
			});

			it("should add new link", async () => {
				const res = await broker.call("v1.accounts.socialLogin", {
					provider: "facebook",
					profile: {
						socialID: 5000
					},
					accessToken: "token-8"
				}, { meta });

				expect(res).toEqual({
					...savedUser,
					socialLinks: {
						google: 4000,
						facebook: 5000
					},
					verified: true,
					token: expect.any(String)
				});
			});

		});

	});

	describe("Test `link` & `unlink` actions", () => {

		const user = {
			username: "user9",
			password: "password9",
			email: "user9@kantab.io",
			firstName: "User",
			lastName: "Nine"
		};

		let savedUser;

		beforeAll(async () => {
			service.sendMail.mockClear();
			service.config["accounts.verification.enabled"] = false;
		});

		it("should create user without links", async () => {
			savedUser = await broker.call("v1.accounts.register", user);

			expect(savedUser).toEqual({
				_id: expect.any(String),
				username: "user9",
				email: "user9@kantab.io",
				firstName: "User",
				lastName: "Nine",
				avatar: "https://gravatar.com/avatar/328e47ea15a902d25ef32f2a59cb9199?s=64&d=robohash",
				plan: "free",
				roles: ["user"],
				socialLinks: {},
				verified: true,
				status: 1,
				createdAt: expect.any(Number),
				token: expect.any(String)
			});

			delete savedUser.token;
		});

		it("should link user to google", async () => {
			const res = await broker.call("v1.accounts.link", {
				id: savedUser._id,
				provider: "google",
				profile: {
					socialID: 6000
				}
			});

			expect(res).toEqual({
				...savedUser,
				socialLinks: {
					google: 6000
				}
			});
		});

		it("should link user to facebook", async () => {
			const res = await broker.call("v1.accounts.link", {
				id: savedUser._id,
				provider: "facebook",
				profile: {
					socialID: 7000
				}
			});

			expect(res).toEqual({
				...savedUser,
				socialLinks: {
					google: 6000,
					facebook: 7000
				}
			});
		});

		it("should unlink user from google", async () => {
			const res = await broker.call("v1.accounts.unlink", {
				id: savedUser._id,
				provider: "google"
			});

			expect(res).toEqual({
				...savedUser,
				socialLinks: {
					google: null,
					facebook: 7000
				}
			});
		});

		it("should unlink user from facebook", async () => {
			const res = await broker.call("v1.accounts.unlink", {
				id: savedUser._id,
				provider: "facebook"
			});

			expect(res).toEqual({
				...savedUser,
				socialLinks: {
					google: null,
					facebook: null
				}
			});
		});

	});

	describe.only("Test `passwordless` action", () => {

		const user = {
			username: "user10",
			email: "user10@kantab.io",
			firstName: "User",
			lastName: "Ten"
		};

		let savedUser;
		let passwordlessToken;

		beforeAll(async () => {
			service.sendMail = jest.fn();
			service.config["accounts.verification.enabled"] = false;
			service.config["accounts.passwordless.enabled"] = true;

			savedUser = await broker.call("v1.accounts.register", user);
		});

		it("should generate passwordless token", async () => {
			service.sendMail.mockClear();
			await service.sendMagicLink(new Context(broker), savedUser);

			passwordlessToken = service.sendMail.mock.calls[0][3].token;

			expect(passwordlessToken).toBeDefined();
		});

		it("should throw error if passwordless is disabled", async () => {
			service.config["accounts.passwordless.enabled"] = false;

			expect.assertions(4);
			try {
				await broker.call("v1.accounts.passwordless", { token: "12345" });
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("ERR_PASSWORDLESS_DISABLED");
			}

			service.config["accounts.passwordless.enabled"] = true;
		});

		it("should throw error if token is not exist", async () => {
			expect.assertions(4);
			try {
				await broker.call("v1.accounts.passwordless", { token: "12345" });
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("INVALID_TOKEN");
			}
		});

		it("should return token if token is valid and not expired", async () => {
			const res = await broker.call("v1.accounts.passwordless", { token: passwordlessToken });

			expect(res).toEqual({
				token: expect.any(String)
			});
		});

		it("should return token multiple times while token is not expired", async () => {
			const res = await broker.call("v1.accounts.passwordless", { token: passwordlessToken });

			expect(res).toEqual({
				token: expect.any(String)
			});
		});

		it("should throw error if token is expired", async () => {
			await broker.call("v1.accounts.update", {
				id: savedUser._id,
				passwordlessTokenExpires: Date.now() - (3600 * 1000) - 5000
			});

			expect.assertions(4);
			try {
				await broker.call("v1.accounts.passwordless", { token: passwordlessToken });
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("TOKEN_EXPIRED");
			}
		});

	});

});
