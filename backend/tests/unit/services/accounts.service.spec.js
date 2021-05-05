"use strict";

const { ServiceBroker, Context } = require("moleculer");
const TestService = require("../../../services/accounts.service");
const ConfigService = require("../../../services/config.service");
const E = require("moleculer").Errors;

const FindEntityMiddleware = require("../../../middlewares/find-entity.middleware");
const CheckPermissionsMiddleware = require("../../../middlewares/check-permissions.middleware");

process.env.JWT_SECRET = "kantab-secret-test";

async function setConf(broker, key, value) {
	await broker.call("v1.config.set", { key, value });
}
describe("Test Accounts service", () => {
	let broker = new ServiceBroker({
		logger: false,
		middlewares: [
			FindEntityMiddleware
			//CheckPermissionsMiddleware
		]
	});

	// Config service
	broker.createService(ConfigService);

	// Mail service
	const mailSendMock = jest.fn(() => Promise.resolve(true));
	broker.createService({
		name: "mail",
		version: 1,
		actions: {
			send: mailSendMock
		}
	});

	// Accounts service
	const service = broker.createService(TestService, {});

	beforeAll(() => broker.start());
	afterAll(() => broker.stop());

	async function unverifiedAccount(id) {
		await broker.call("accounts.update", {
			id,
			verified: false
		});
	}

	async function verifiedAccount(id) {
		await broker.call("accounts.update", {
			id,
			verified: true
		});
	}

	it("check action visibilities", async () => {
		expect(broker.findNextActionEndpoint("accounts.create").action.visibility).toBe(
			"protected"
		);
		expect(broker.findNextActionEndpoint("accounts.list").action.visibility).toBe("protected");
		expect(broker.findNextActionEndpoint("accounts.find").action.visibility).toBe("protected");
		expect(broker.findNextActionEndpoint("accounts.get").action.visibility).toBe("protected");
		expect(broker.findNextActionEndpoint("accounts.update").action.visibility).toBe(
			"protected"
		);
		expect(broker.findNextActionEndpoint("accounts.remove").action.visibility).toBe(
			"protected"
		);
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
				iat: expect.any(Number)
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
			let oldSendMail, oldUpdateById;
			beforeAll(() => {
				oldSendMail = mailSendMock;
				oldUpdateById = service.adapter.updateById;
			});
			afterAll(() => {
				mailSendMock = oldSendMail;
				service.adapter.updateById = oldUpdateById;
			});

			it("should generate passwordless token & call sendMail", async () => {
				mailSendMock = jest.fn();

				const ctx = new Context(broker);
				const user = { _id: 123, name: "John", email: "john@kantab.io" };

				service.adapter.updateById = jest.fn(async () => user);

				await service.sendMagicLink(ctx, user);

				expect(mailSendMock).toHaveBeenCalledTimes(1);
				expect(mailSendMock).toHaveBeenCalledWith(ctx, user, "magic-link", {
					token: expect.any(String)
				});

				expect(service.adapter.updateById).toHaveBeenCalledTimes(1);
				expect(service.adapter.updateById).toHaveBeenCalledWith(123, {
					$set: {
						passwordlessToken: expect.any(String),
						passwordlessTokenExpires: expect.any(Number)
					}
				});
			});
		});

		describe("Test sendMail method", () => {
			it("should not call mail.send service", async () => {
				await setConf(broker, "mail.enabled", false);

				const ctx = new Context(broker);

				const res = await mailSendMock(ctx, {}, "welcome", {});

				expect(res).toBe(false);
			});

			it("should call mail.send service", async () => {
				await setConf(broker, "mail.enabled", true);

				const ctx = new Context(broker);
				const user = { _id: 1, name: "John", email: "john@kantab.io" };
				const data = { a: 5 };

				const res = await mailSendMock(ctx, user, "welcome", data);
				expect(res).toBe(true);
				expect(mailSendMock).toHaveBeenCalledTimes(1);
				const params = mailSendMock.mock.calls[0][0].params;
				expect(params).toEqual({
					data: {
						a: 5,
						site: { name: "KanTab", url: "http://localhost:4000" },
						user: { _id: 1, name: "John", email: "john@kantab.io" }
					},
					template: "welcome",
					to: "john@kantab.io"
				});
			});
		});
	});

	describe("Test 'register' & 'verify' action", () => {
		beforeAll(() => {
			mailSendMock = jest.fn(() => Promise.resolve());
		});

		const user1 = {
			username: "user1",
			password: "password1",
			email: "user1@kantab.io",
			fullName: "User One",
			avatar: "https://s3.amazonaws.com/uifaces/faces/twitter/ekvium/128.jpg"
		};

		const user2 = {
			username: "user2",
			password: "password2",
			email: "user2@kantab.io",
			fullName: "User Two"
		};

		const user3 = {
			username: "user3",
			email: "user3@kantab.io",
			fullName: "User Three"
		};

		it("should throw error if signup is disabled", async () => {
			await setConf(broker, "accounts.signup.enabled", false);

			expect.assertions(4);
			try {
				await broker.call("accounts.register", user1);
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("ERR_SIGNUP_DISABLED");
			}

			await setConf(broker, "accounts.signup.enabled", true);
		});

		it("should throw error if email is exist", async () => {
			expect.assertions(4);
			try {
				await broker.call(
					"accounts.register",
					Object.assign({}, user1, { email: "test@kantab.io" })
				);
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("ERR_EMAIL_EXISTS");
			}
		});

		it("should throw error if username is not exist but username is enabled", async () => {
			await setConf(broker, "accounts.username.enabled", true);

			expect.assertions(4);
			try {
				await broker.call(
					"accounts.register",
					Object.assign({}, user1, { username: null })
				);
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("ERR_USERNAME_EMPTY");
			}
		});

		it("should throw error if username is exist", async () => {
			await setConf(broker, "accounts.username.enabled", true);

			expect.assertions(4);
			try {
				await broker.call(
					"accounts.register",
					Object.assign({}, user1, { username: "test" })
				);
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("ERR_USERNAME_EXISTS");
			}
		});

		it("should create new user with avatar, password without verification", async () => {
			await setConf(broker, "accounts.verification.enabled", false);

			const res = await broker.call("accounts.register", user1);

			expect(res).toEqual({
				id: expect.any(String),
				email: "user1@kantab.io",
				username: "user1",
				fullName: "User One",
				passwordless: false,
				roles: ["user"],
				plan: "free",
				socialLinks: {},
				createdAt: expect.any(Number),
				verified: true,
				status: 1,
				avatar: "https://s3.amazonaws.com/uifaces/faces/twitter/ekvium/128.jpg",
				token: expect.any(String)
			});

			expect(mailSendMock).toHaveBeenCalledTimes(1);
			expect(mailSendMock).toHaveBeenCalledWith(
				expect.any(Context),
				Object.assign({ password: expect.any(String) }, res, {
					_id: res.id,
					id: undefined
				}),
				"welcome"
			);
		});

		it("should create new user without avatar with verification", async () => {
			mailSendMock.mockClear();
			await setConf(broker, "accounts.verification.enabled", true);

			const res = await broker.call("accounts.register", user2);

			expect(res).toEqual({
				id: expect.any(String),
				email: "user2@kantab.io",
				username: "user2",
				fullName: "User Two",
				passwordless: false,
				roles: ["user"],
				plan: "free",
				socialLinks: {},
				createdAt: expect.any(Number),
				verified: false,
				status: 1,
				avatar:
					"https://gravatar.com/avatar/6a99f787601d736a0d1b79b13a252f9a?s=64&d=robohash"
			});

			expect(mailSendMock).toHaveBeenCalledTimes(1);
			expect(mailSendMock).toHaveBeenCalledWith(
				expect.any(Context),
				Object.assign(
					{
						password: expect.any(String),
						verificationToken: expect.any(String)
					},
					res,
					{ _id: res.id, id: undefined }
				),
				"activate",
				{ token: expect.any(String) }
			);
		});

		it("should throw error if no password & passwordless is not enabled", async () => {
			mailSendMock.mockClear();
			await setConf(broker, "accounts.passwordless.enabled", false);

			expect.assertions(4);
			try {
				await broker.call("accounts.register", user3);
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("ERR_PASSWORD_EMPTY");
			}
		});

		let user3VerificationToken;

		it("should create new passwordless user", async () => {
			mailSendMock.mockClear();
			await setConf(broker, "accounts.passwordless.enabled", true);
			await setConf(broker, "accounts.defaultRoles", ["admin", "visitor"]);
			await setConf(broker, "accounts.defaultPlan", "premium");

			const res = await broker.call("accounts.register", user3);

			expect(res).toEqual({
				id: expect.any(String),
				email: "user3@kantab.io",
				username: "user3",
				fullName: "User Three",
				passwordless: true,
				roles: ["admin", "visitor"],
				plan: "premium",
				socialLinks: {},
				createdAt: expect.any(Number),
				verified: false,
				status: 1,
				avatar:
					"https://gravatar.com/avatar/9b846cdc5f5eb743c4ef2c556a822d22?s=64&d=robohash"
			});

			expect(mailSendMock).toHaveBeenCalledTimes(1);
			expect(mailSendMock).toHaveBeenCalledWith(
				expect.any(Context),
				Object.assign(
					{
						password: expect.any(String),
						verificationToken: expect.any(String)
					},
					res,
					{ _id: res.id, id: undefined }
				),
				"activate",
				{ token: expect.any(String) }
			);

			user3VerificationToken = mailSendMock.mock.calls[0][3].token;
		});

		it("should verify user3 with token", async () => {
			mailSendMock.mockClear();

			const res = await broker.call("accounts.verify", { token: user3VerificationToken });
			expect(res).toEqual({
				token: expect.any(String)
			});

			expect(mailSendMock).toHaveBeenCalledTimes(1);
			expect(mailSendMock).toHaveBeenCalledWith(
				expect.any(Context),
				Object.assign(
					{},
					{
						_id: expect.any(String),
						email: "user3@kantab.io",
						username: "user3",
						fullName: "User Three",
						password: expect.any(String),
						passwordless: true,
						roles: ["admin", "visitor"],
						plan: "premium",
						socialLinks: {},
						createdAt: expect.any(Number),
						verified: true, // !
						verificationToken: null,
						status: 1,
						avatar:
							"https://gravatar.com/avatar/9b846cdc5f5eb743c4ef2c556a822d22?s=64&d=robohash"
					}
				),
				"welcome"
			);

			await setConf(broker, "accounts.defaultRoles", "user");
			await setConf(broker, "accounts.defaultPlan", "free");
		});

		it("should throw error if verification token is not exist", async () => {
			expect.assertions(4);
			try {
				await broker.call("accounts.verify", { token: "12345678" });
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
			mailSendMock = jest.fn(() => Promise.resolve());
		});

		describe("with password", () => {
			const user = {
				username: "user4",
				password: "password4",
				email: "user4@kantab.io",
				fullName: "User Four"
			};

			let savedUser, verificationToken;

			beforeAll(async () => {
				mailSendMock.mockClear();
				await setConf(broker, "accounts.verification.enabled", true);

				const regged = await broker.call("accounts.register", user);
				savedUser = regged;
				verificationToken = mailSendMock.mock.calls[0][3].token;
			});

			it("should not logged in with non-exist account", async () => {
				expect.assertions(4);
				try {
					await broker.call("accounts.login", {
						email: "no-user@kantab.io",
						password: "pass"
					});
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_ACCOUNT_NOT_FOUND");
				}
			});

			it("should not logged in unverified account", async () => {
				expect.assertions(4);
				try {
					await broker.call("accounts.login", {
						email: "user4@kantab.io",
						password: "password4"
					});
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ACCOUNT_NOT_VERIFIED");
				}
			});

			it("verify account", async () => {
				await broker.call("accounts.verify", { token: verificationToken });
			});

			it("should not logged in with wrong password", async () => {
				expect.assertions(4);
				try {
					await broker.call("accounts.login", {
						email: "user4@kantab.io",
						password: "wrong-password"
					});
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("WRONG_PASSWORD");
				}
			});

			it("should logged with correct email & password", async () => {
				const res = await broker.call("accounts.login", {
					email: "user4@kantab.io",
					password: "password4"
				});
				expect(res).toEqual({
					token: expect.any(String)
				});
			});

			it("should not logged in with username if this feature is disabled", async () => {
				expect.assertions(4);
				await setConf(broker, "accounts.username.enabled", false);

				try {
					await broker.call("accounts.login", {
						email: "user4",
						password: "password4"
					});
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_ACCOUNT_NOT_FOUND");
				}
			});

			it("should logged with correct username & password", async () => {
				await setConf(broker, "accounts.username.enabled", true);
				const res = await broker.call("accounts.login", {
					email: "user4",
					password: "password4"
				});
				expect(res).toEqual({
					token: expect.any(String)
				});
			});

			it("should not logged in disabled account", async () => {
				expect.assertions(4);

				await broker.call("accounts.disable", { id: savedUser.id });

				try {
					await broker.call("accounts.login", {
						email: "user4@kantab.io",
						password: "password4"
					});
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ACCOUNT_DISABLED");
				}

				await broker.call("accounts.enable", { id: savedUser.id });
			});

			it("should not send magic-link email if no password and feature is disabled", async () => {
				await setConf(broker, "accounts.passwordless.enabled", false);
				expect.assertions(4);
				try {
					await broker.call("accounts.login", { email: "user4@kantab.io" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("PASSWORDLESS_DISABLED");
				}
			});

			it("should send magic-link email if no password and feature is enabled", async () => {
				await setConf(broker, "accounts.passwordless.enabled", true);
				const oldSendMagicLink = service.sendMagicLink;
				service.sendMagicLink = jest.fn();
				const res = await broker.call("accounts.login", { email: "user4@kantab.io" });
				expect(res).toEqual({
					email: "user4@kantab.io",
					passwordless: true
				});

				expect(service.sendMagicLink).toHaveBeenCalledTimes(1);
				expect(service.sendMagicLink).toHaveBeenCalledWith(
					expect.any(Context),
					Object.assign({}, savedUser, {
						password: expect.any(String),
						verified: true,
						verificationToken: null,
						_id: savedUser.id,
						id: undefined
					})
				);

				service.sendMagicLink = oldSendMagicLink;
			});
		});

		describe("with passwordless", () => {
			const user = {
				username: "user5",
				email: "user5@kantab.io",
				fullName: "User Five"
			};

			let savedUser, verificationToken;
			let oldSendMagicLink;

			beforeAll(async () => {
				mailSendMock.mockClear();

				oldSendMagicLink = service.sendMagicLink;
				service.sendMagicLink = jest.fn();

				await setConf(broker, "accounts.passwordless.enabled", true);

				const regged = await broker.call("accounts.register", user);
				savedUser = regged;
				verificationToken = mailSendMock.mock.calls[0][3].token;
			});

			afterAll(async () => {
				service.sendMagicLink = oldSendMagicLink;
			});

			it("should not logged in unverified account", async () => {
				expect.assertions(4);
				try {
					await broker.call("accounts.login", { email: "user5@kantab.io" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ACCOUNT_NOT_VERIFIED");
				}
			});

			it("verify account", async () => {
				await broker.call("accounts.verify", { token: verificationToken });
			});

			it("should not logged in with password", async () => {
				expect.assertions(4);
				try {
					await broker.call("accounts.login", {
						email: "user5@kantab.io",
						password: "some-password"
					});
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_PASSWORDLESS_WITH_PASSWORD");
				}
			});

			it("should not logged in if mail sending is disabled", async () => {
				await setConf(broker, "mail.enabled", false);
				expect.assertions(4);
				try {
					await broker.call("accounts.login", { email: "user5@kantab.io" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_PASSWORDLESS_UNAVAILABLE");
				}
				await setConf(broker, "mail.enabled", true);
			});

			it("should not logged in if passwordless feature is disabled", async () => {
				await setConf(broker, "accounts.passwordless.enabled", false);
				expect.assertions(4);
				try {
					await broker.call("accounts.login", { email: "user5@kantab.io" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("PASSWORDLESS_DISABLED");
				}
				await setConf(broker, "accounts.passwordless.enabled", true);
			});

			it("should send magic-link email if email is exist", async () => {
				service.sendMagicLink.mockClear();
				const res = await broker.call("accounts.login", { email: "user5@kantab.io" });
				expect(res).toEqual({
					email: "user5@kantab.io",
					passwordless: true
				});

				expect(service.sendMagicLink).toHaveBeenCalledTimes(1);
				expect(service.sendMagicLink).toHaveBeenCalledWith(
					expect.any(Context),
					Object.assign(
						{},
						savedUser,
						{
							password: expect.any(String),
							verified: true,
							verificationToken: null
						},
						{ _id: savedUser.id, id: undefined }
					)
				);
			});

			it("should not logged in with username if this feature is disabled", async () => {
				expect.assertions(4);
				await setConf(broker, "accounts.username.enabled", false);

				try {
					await broker.call("accounts.login", {
						email: "user5",
						password: "password5"
					});
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_ACCOUNT_NOT_FOUND");
				}
			});

			it("should send magic-link email if username is exist", async () => {
				await setConf(broker, "accounts.username.enabled", true);
				service.sendMagicLink.mockClear();
				const res = await broker.call("accounts.login", { email: "user5" });
				expect(res).toEqual({
					email: "user5@kantab.io",
					passwordless: true
				});

				expect(service.sendMagicLink).toHaveBeenCalledTimes(1);
				expect(service.sendMagicLink).toHaveBeenCalledWith(
					expect.any(Context),
					Object.assign(
						{},
						savedUser,
						{
							password: expect.any(String),
							verified: true,
							verificationToken: null
						},
						{ _id: savedUser.id, id: undefined }
					)
				);
			});

			it("should not logged in disabled account", async () => {
				expect.assertions(4);

				await broker.call("accounts.disable", { id: savedUser.id });

				try {
					await broker.call("accounts.login", { email: "user5@kantab.io" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ACCOUNT_DISABLED");
				}
			});
		});

		describe("Test resolveToken", () => {
			let savedUser, token;

			beforeAll(async () => {
				savedUser = await service.getUserByUsername(new Context(broker), "test");
			});

			it("should generate a token after login", async () => {
				const res = await broker.call("accounts.login", {
					email: "test",
					password: "test"
				});
				expect(res.token).toBeDefined();
				token = res.token;
			});

			it("should throw error if token is invalid", async () => {
				expect.assertions(4);
				try {
					await broker.call("accounts.resolveToken", { token: "12345" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(401);
					expect(err.type).toBe("INVALID_TOKEN");
				}
			});

			it("should throw error if token is invalid", async () => {
				const wrongToken = await service.generateJWT({});
				expect.assertions(4);
				try {
					await broker.call("accounts.resolveToken", { token: wrongToken });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(401);
					expect(err.type).toBe("INVALID_TOKEN");
				}
			});

			it("should throw error if user is not found", async () => {
				const wrongToken = await service.generateJWT({ id: 1 });
				expect.assertions(4);
				try {
					await broker.call("accounts.resolveToken", { token: wrongToken });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(401);
					expect(err.type).toBe("ACCOUNT_NOT_FOUND");
				}
			});

			it("should throw error if account is not verified", async () => {
				await unverifiedAccount(savedUser._id);

				expect.assertions(4);
				try {
					await broker.call("accounts.resolveToken", { token });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(401);
					expect(err.type).toBe("ACCOUNT_NOT_VERIFIED");
				}

				await verifiedAccount(savedUser._id);
			});

			it("should throw error if account is disabled", async () => {
				await broker.call("accounts.disable", { id: savedUser._id });

				expect.assertions(4);
				try {
					await broker.call("accounts.resolveToken", { token });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(401);
					expect(err.type).toBe("ACCOUNT_DISABLED");
				}

				await broker.call("accounts.enable", { id: savedUser._id });
			});

			it("should return resolved user if token is valid", async () => {
				const res = await broker.call("accounts.resolveToken", { token });

				expect(res).toEqual({
					id: expect.any(String),
					avatar:
						"https://user-images.githubusercontent.com/306521/112635366-03ed5700-8e3c-11eb-80a3-49804bf7e7c4.png",
					email: "test@kantab.io",
					username: "test",
					fullName: "Test User",
					passwordless: false,
					plan: "free",
					roles: ["user"],
					createdAt: expect.any(Number),
					socialLinks: {},
					totp: {
						enabled: false
					},
					status: 1,
					verified: true
				});
			});
		});

		describe("Test resolveToken", () => {
			let savedUser;

			beforeAll(async () => {
				savedUser = await service.getUserByUsername(new Context(broker), "test");
			});

			it("should throw error if no user in meta", async () => {
				const res = await broker.call("accounts.me");
				expect(res).toBeNull();
			});

			it("should throw error if user is not found", async () => {
				const res = await broker.call("accounts.me", null, { meta: { userID: 1 } });
				expect(res).toBeNull();
			});

			it("should throw error if account is not activated", async () => {
				await unverifiedAccount(savedUser._id);

				const res = await broker.call("accounts.me", null, {
					meta: { userID: savedUser._id }
				});
				expect(res).toBeNull();

				await verifiedAccount(savedUser._id);
			});

			it("should throw error if account is disabled", async () => {
				await broker.call("accounts.disable", { id: savedUser._id });

				const res = await broker.call("accounts.me", null, {
					meta: { userID: savedUser._id }
				});
				expect(res).toBeNull();

				await broker.call("accounts.enable", { id: savedUser._id });
			});

			it("should return user after enabling", async () => {
				const res = await broker.call("accounts.me", null, {
					meta: { userID: savedUser._id }
				});
				expect(res).toEqual({
					id: expect.any(String),
					avatar:
						"https://user-images.githubusercontent.com/306521/112635366-03ed5700-8e3c-11eb-80a3-49804bf7e7c4.png",
					email: "test@kantab.io",
					username: "test",
					fullName: "Test User",
					passwordless: false,
					plan: "free",
					roles: ["user"],
					createdAt: expect.any(Number),
					socialLinks: {},
					totp: {
						enabled: false
					},
					status: 1,
					verified: true
				});
			});
		});
	});

	describe("Test 'socialLogin' action", () => {
		beforeAll(() => {
			mailSendMock = jest.fn(() => Promise.resolve());
		});

		describe("without logged in user", () => {
			const user = {
				username: "user6",
				password: "password6",
				email: "user6@kantab.io",
				fullName: "User Six"
			};

			let savedUser;

			beforeAll(async () => {
				mailSendMock.mockClear();
				await setConf(broker, "accounts.verification.enabled", true);

				savedUser = await broker.call("accounts.register", user);
			});

			it("should throw error if profile doesn't contain email", async () => {
				expect.assertions(4);
				try {
					await broker.call("accounts.socialLogin", {
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
				await broker.call("accounts.disable", { id: savedUser.id });
				try {
					await broker.call("accounts.socialLogin", {
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
				await broker.call("accounts.enable", { id: savedUser.id });
			});

			it("should link the profile to an existing account", async () => {
				const res = await broker.call("accounts.socialLogin", {
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
				const res = await broker.call("accounts.socialLogin", {
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
				const res = await broker.call("accounts.socialLogin", {
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
				await setConf(broker, "accounts.signup.enabled", false);
				expect.assertions(4);
				try {
					await broker.call("accounts.socialLogin", {
						provider: "google",
						profile: {
							socialID: 3000,
							email: "user7@kantab.io",
							fullName: "User Seven",
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
				await setConf(broker, "accounts.signup.enabled", true);

				const res = await broker.call("accounts.socialLogin", {
					provider: "google",
					profile: {
						socialID: 3000,
						email: "user7@kantab.io",
						fullName: "User Seven",
						avatar: "social-avatar.jpg"
					},
					accessToken: "token-100"
				});

				expect(res).toEqual({
					id: expect.any(String),
					email: "user7@kantab.io",
					username: "user7",
					fullName: "User Seven",
					passwordless: false,
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
				fullName: "User Eight"
			};

			let savedUser;
			let meta;

			beforeAll(async () => {
				mailSendMock.mockClear();
				await setConf(broker, "accounts.verification.enabled", false);

				savedUser = await broker.call("accounts.register", user);
				meta = { userID: savedUser.id, user: savedUser };
			});

			it("should throw error if socialID is assigned to another account", async () => {
				expect.assertions(4);
				try {
					await broker.call(
						"accounts.socialLogin",
						{
							provider: "google",
							profile: {
								socialID: 3000
							},
							accessToken: "token-8"
						},
						{ meta }
					);
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_SOCIAL_ACCOUNT_MISMATCH");
				}
			});

			it("should link & login with same user", async () => {
				const res = await broker.call(
					"accounts.socialLogin",
					{
						provider: "google",
						profile: {
							socialID: 4000
						},
						accessToken: "token-8"
					},
					{ meta }
				);

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
				const res = await broker.call(
					"accounts.socialLogin",
					{
						provider: "google",
						profile: {
							socialID: 4000
						},
						accessToken: "token-8"
					},
					{ meta }
				);

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
				const res = await broker.call(
					"accounts.socialLogin",
					{
						provider: "facebook",
						profile: {
							socialID: 5000
						},
						accessToken: "token-8"
					},
					{ meta }
				);

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
			fullName: "User Nine"
		};

		let savedUser;

		beforeAll(async () => {
			mailSendMock.mockClear();
			await setConf(broker, "accounts.verification.enabled", false);
		});

		it("should create user without links", async () => {
			savedUser = await broker.call("accounts.register", user);

			expect(savedUser).toEqual({
				id: expect.any(String),
				username: "user9",
				email: "user9@kantab.io",
				fullName: "User Nine",
				passwordless: false,
				avatar:
					"https://gravatar.com/avatar/328e47ea15a902d25ef32f2a59cb9199?s=64&d=robohash",
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
			const res = await broker.call("accounts.link", {
				id: savedUser.id,
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
			const res = await broker.call("accounts.link", {
				id: savedUser.id,
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

		it("should not unlink if no user", async () => {
			expect.assertions(4);
			try {
				await broker.call("accounts.unlink", {
					provider: "google"
				});
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("MISSING_USER_ID");
			}
		});

		it("should unlink user from google via meta", async () => {
			const res = await broker.call(
				"accounts.unlink",
				{
					provider: "google"
				},
				{ meta: { userID: savedUser.id } }
			);

			expect(res).toEqual({
				...savedUser,
				socialLinks: {
					//google: null,
					facebook: 7000
				}
			});
		});

		it("should unlink user from facebook", async () => {
			const res = await broker.call("accounts.unlink", {
				id: savedUser.id,
				provider: "facebook"
			});

			expect(res).toEqual({
				...savedUser,
				socialLinks: {
					//google: null,
					//facebook: null
				}
			});
		});
	});

	describe("Test `passwordless` action", () => {
		const user = {
			username: "user10",
			email: "user10@kantab.io",
			fullName: "User Ten"
		};

		let savedUser;
		let passwordlessToken;

		beforeAll(async () => {
			mailSendMock = jest.fn();
			await setConf(broker, "accounts.verification.enabled", false);
			await setConf(broker, "accounts.passwordless.enabled", true);

			savedUser = await broker.call("accounts.register", user);
		});

		it("should generate passwordless token", async () => {
			mailSendMock.mockClear();
			await service.sendMagicLink(new Context(broker), { _id: savedUser.id });

			passwordlessToken = mailSendMock.mock.calls[0][3].token;

			expect(passwordlessToken).toBeDefined();
		});

		it("should throw error if passwordless is disabled", async () => {
			await setConf(broker, "accounts.passwordless.enabled", false);

			expect.assertions(4);
			try {
				await broker.call("accounts.passwordless", { token: "12345" });
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("PASSWORDLESS_DISABLED");
			}

			await setConf(broker, "accounts.passwordless.enabled", true);
		});

		it("should throw error if token is not exist", async () => {
			expect.assertions(4);
			try {
				await broker.call("accounts.passwordless", { token: "12345" });
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("INVALID_TOKEN");
			}
		});

		it("should throw error if account is disabled", async () => {
			await broker.call("accounts.disable", { id: savedUser.id });

			expect.assertions(4);
			try {
				await broker.call("accounts.passwordless", { token: passwordlessToken });
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("ACCOUNT_DISABLED");
			}

			await broker.call("accounts.enable", { id: savedUser.id });
		});

		it("should return token if token is valid and not expired", async () => {
			const res = await broker.call("accounts.passwordless", { token: passwordlessToken });

			expect(res).toEqual({
				token: expect.any(String)
			});
		});

		it("should return token multiple times while token is not expired", async () => {
			const res = await broker.call("accounts.passwordless", { token: passwordlessToken });

			expect(res).toEqual({
				token: expect.any(String)
			});
		});

		it("should verify account if it is not verified yet", async () => {
			await unverifiedAccount(savedUser.id);

			const res = await broker.call("accounts.passwordless", { token: passwordlessToken });

			expect(res).toEqual({
				token: expect.any(String)
			});

			const user = await service.getUserByUsername(new Context(broker), "user10");
			expect(user.verified).toBe(true);
		});

		it("should throw error if token is expired", async () => {
			await broker.call("accounts.update", {
				id: savedUser.id,
				passwordlessTokenExpires: Date.now() - 5000
			});

			expect.assertions(4);
			try {
				await broker.call("accounts.passwordless", { token: passwordlessToken });
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("TOKEN_EXPIRED");
			}
		});
	});

	describe("Test forgot password flow", () => {
		const user = {
			username: "user11",
			password: "password11",
			email: "user11@kantab.io",
			fullName: "User Eleven"
		};

		let savedUser;
		let resetToken;

		beforeAll(async () => {
			mailSendMock = jest.fn();
			await setConf(broker, "accounts.verification.enabled", false);

			savedUser = await broker.call("accounts.register", user);
		});

		describe("Test `forgotPassword` action", () => {
			it("should login with username & original password", async () => {
				const res = await broker.call("accounts.login", {
					email: user.email,
					password: user.password
				});

				expect(res).toEqual({
					token: expect.any(String)
				});
			});

			it("should throw error if email is not found", async () => {
				expect.assertions(4);
				try {
					await broker.call("accounts.forgotPassword", { email: "user12@kantab.io" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_EMAIL_NOT_FOUND");
				}
			});

			it("should throw error if account is not verified", async () => {
				await unverifiedAccount(savedUser.id);

				expect.assertions(4);
				try {
					await broker.call("accounts.forgotPassword", { email: "user11@kantab.io" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ACCOUNT_NOT_VERIFIED");
				}

				await verifiedAccount(savedUser.id);
			});

			it("should throw error if account is disabled", async () => {
				await broker.call("accounts.disable", { id: savedUser.id });

				expect.assertions(4);
				try {
					await broker.call("accounts.forgotPassword", { email: "user11@kantab.io" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ACCOUNT_DISABLED");
				}

				await broker.call("accounts.enable", { id: savedUser.id });
			});

			it("should generate token and call sendMail", async () => {
				mailSendMock.mockClear();

				const res = await broker.call("accounts.forgotPassword", {
					email: "user11@kantab.io"
				});

				expect(res).toBe(true);

				expect(mailSendMock).toHaveBeenCalledTimes(1);
				expect(mailSendMock).toHaveBeenCalledWith(
					expect.any(Context),
					expect.any(Object),
					"reset-password",
					{
						token: expect.any(String)
					}
				);
				resetToken = mailSendMock.mock.calls[0][3].token;
			});
		});

		describe("Test `resetPassword` action", () => {
			it("should throw error if token is not exist", async () => {
				expect.assertions(4);
				try {
					await broker.call("accounts.resetPassword", {
						token: "12345",
						password: "newpass1234"
					});
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("INVALID_TOKEN");
				}
			});

			it("should throw error if account is disabled", async () => {
				await broker.call("accounts.disable", { id: savedUser.id });

				expect.assertions(4);
				try {
					await broker.call("accounts.resetPassword", {
						token: resetToken,
						password: "newpass1234"
					});
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ACCOUNT_DISABLED");
				}

				await broker.call("accounts.enable", { id: savedUser.id });
			});

			it("should throw error if token is expired", async () => {
				await broker.call("accounts.update", {
					id: savedUser.id,
					resetTokenExpires: Date.now() - 3600 * 1000 - 5000
				});

				expect.assertions(4);
				try {
					await broker.call("accounts.resetPassword", {
						token: resetToken,
						password: "newpass1234"
					});
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("TOKEN_EXPIRED");
				}

				await broker.call("accounts.update", {
					id: savedUser.id,
					resetTokenExpires: Date.now() + 3600 * 1000
				});
			});

			it("should return token if token is valid and not expired", async () => {
				mailSendMock.mockClear();
				const res = await broker.call("accounts.resetPassword", {
					token: resetToken,
					password: "newpass1234"
				});

				expect(res).toEqual({
					token: expect.any(String)
				});

				expect(mailSendMock).toHaveBeenCalledTimes(1);
				expect(mailSendMock).toHaveBeenCalledWith(
					expect.any(Context),
					expect.any(Object),
					"password-changed"
				);
			});

			it("should not accept token multiple times", async () => {
				expect.assertions(4);
				try {
					await broker.call("accounts.resetPassword", {
						token: resetToken,
						password: "newpass1234"
					});
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("INVALID_TOKEN");
				}
			});

			it("should login with username & new password", async () => {
				const res = await broker.call("accounts.login", {
					email: user.email,
					password: "newpass1234"
				});

				expect(res).toEqual({
					token: expect.any(String)
				});
			});

			it("should not login with username & original password", async () => {
				expect.assertions(4);
				try {
					await broker.call("accounts.login", {
						email: user.email,
						password: user.password
					});
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("WRONG_PASSWORD");
				}
			});
		});
	});

	describe("Test `disable` & `enable` actions", () => {
		const user = {
			//username: "user12",
			password: "password12",
			email: "user12@kantab.io",
			fullName: "User Twelve"
		};

		let savedUser;

		beforeAll(async () => {
			await setConf(broker, "accounts.username.enabled", false);
			await setConf(broker, "accounts.verification.enabled", false);
			savedUser = await broker.call("accounts.register", user);
		});

		it("should not contain username if this feature is disabled", async () => {
			expect(savedUser.username).toBeUndefined();
		});

		it("should throw error if user not found", async () => {
			expect.assertions(4);
			try {
				await broker.call("accounts.disable", { id: "1234" });
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("ERR_ENTITY_NOT_FOUND");
			}
		});

		it("should disable account", async () => {
			const res = await broker.call("accounts.disable", { id: savedUser.id });

			expect(res).toEqual({
				status: 0
			});
		});

		it("should throw error if account has been already disabled", async () => {
			expect.assertions(4);
			try {
				await broker.call("accounts.disable", { id: savedUser.id });
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("ERR_USER_ALREADY_DISABLED");
			}
		});

		it("should throw error if user not found", async () => {
			expect.assertions(4);
			try {
				await broker.call("accounts.enable", { id: "1234" });
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("ERR_ENTITY_NOT_FOUND");
			}
		});

		it("should enable account", async () => {
			const res = await broker.call("accounts.enable", { id: savedUser.id });

			expect(res).toEqual({
				status: 1
			});
		});

		it("should throw error if account has been already enabled", async () => {
			expect.assertions(4);
			try {
				await broker.call("accounts.enable", { id: savedUser.id });
			} catch (err) {
				expect(err).toBeInstanceOf(E.MoleculerClientError);
				expect(err.name).toBe("MoleculerClientError");
				expect(err.code).toBe(400);
				expect(err.type).toBe("ERR_USER_ALREADY_ENABLED");
			}
		});
	});
});
