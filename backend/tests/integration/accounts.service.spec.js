"use strict";

const _ = require("lodash");
const { ServiceBroker } = require("moleculer");
const TokensService = require("../../services/tokens.service");
const AccountsService = require("../../services/accounts.service");
const ConfigService = require("../../services/config.service");
const E = require("moleculer").Errors;

process.env.JWT_SECRET = "kantab-secret-test";
const SITE = { name: "KanTab", url: "http://localhost:4000" };

const FindEntityMiddleware = require("../../middlewares/find-entity.middleware");
const CheckPermissionsMiddleware = require("../../middlewares/check-permissions.middleware");
const AsyncContextMiddleware = require("../../middlewares/async-context.middleware");

describe("Test Accounts service", () => {
	async function unverifiedAccount(broker, id) {
		await broker.call("accounts.update", { id, verified: false });
	}

	async function verifiedAccount(broker, id) {
		await broker.call("accounts.update", { id, verified: true });
	}

	async function disableAccount(broker, id) {
		await broker.call("accounts.disable", { id });
	}

	async function enableAccount(broker, id) {
		await broker.call("accounts.enable", { id });
	}

	async function setConf(broker, key, value) {
		await broker.call("v1.config.set", { key, value });
	}

	describe("Test 'accounts' service actions", () => {
		const broker = new ServiceBroker({
			logger: false,
			middlewares: [FindEntityMiddleware, CheckPermissionsMiddleware, AsyncContextMiddleware]
		});

		// Dependencies
		broker.createService(ConfigService);
		broker.createService(TokensService);

		// Mail service
		const mailSendMock = jest.fn(() => Promise.resolve(true));
		broker.createService({
			name: "mail",
			version: 1,
			actions: {
				send(ctx) {
					return mailSendMock(ctx.params);
				}
			}
		});

		// Tested service
		const service = broker.createService(AccountsService, { version: null });

		beforeAll(() => broker.start());
		afterAll(() => broker.stop());

		it("check action permissions", async () => {
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

		describe("Test 'register' & 'verify' action", () => {
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

				expect.assertions(3);
				try {
					await broker.call("accounts.register", user1);
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_SIGNUP_DISABLED");
				}

				await setConf(broker, "accounts.signup.enabled", true);
			});

			it("should throw error if email is exist", async () => {
				expect.assertions(3);
				try {
					await broker.call("accounts.register", { ...user1, email: "test@kantab.io" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_EMAIL_EXISTS");
				}
			});

			it("should throw error if username is not exist but username is enabled", async () => {
				await setConf(broker, "accounts.username.enabled", true);

				expect.assertions(4);
				try {
					await broker.call("accounts.register", { ...user1, username: null });
				} catch (err) {
					expect(err).toBeInstanceOf(E.ValidationError);
					expect(err.code).toBe(422);
					expect(err.type).toBe("VALIDATION_ERROR");
					expect(err.data).toEqual([
						{
							action: "accounts.register",
							actual: null,
							field: "username",
							message: "The 'username' field is required.",
							nodeID: broker.nodeID,
							type: "required"
						}
					]);
				}
			});

			it("should throw error if username is exist", async () => {
				expect.assertions(3);
				try {
					await broker.call("accounts.register", { ...user1, username: "test" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_USERNAME_EXISTS");
				}
			});

			it("should create new user with avatar, password without verification", async () => {
				await setConf(broker, "accounts.verification.enabled", false);

				const res = await broker.call("accounts.register", _.cloneDeep(user1));

				expect(res).toEqual({
					...user1,
					id: expect.any(String),
					password: undefined,
					passwordless: false,
					roles: ["user"],
					plan: "free",
					socialLinks: {},
					createdAt: expect.any(Number),
					verified: true,
					status: 1,
					token: expect.any(String)
				});

				expect(mailSendMock).toHaveBeenCalledTimes(1);
				expect(mailSendMock).toHaveBeenCalledWith({
					data: {
						site: SITE,
						user: { ...res, token: undefined }
					},
					template: "welcome",
					to: user1.email
				});
			});

			it("should throw error if no password & passwordless is not enabled", async () => {
				await setConf(broker, "accounts.passwordless.enabled", false);

				expect.assertions(3);
				try {
					await broker.call("accounts.register", user3);
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_PASSWORD_EMPTY");
				}
			});

			let user3VerificationToken;
			let savedUser3;

			it("should create new passwordless user", async () => {
				mailSendMock.mockClear();

				await setConf(broker, "accounts.verification.enabled", true);
				await setConf(broker, "accounts.passwordless.enabled", true);
				await setConf(broker, "accounts.defaultRoles", ["admin", "visitor"]);
				await setConf(broker, "accounts.defaultPlan", "premium");

				const res = await broker.call("accounts.register", { ...user3 });

				expect(res).toEqual({
					...user3,
					id: expect.any(String),
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
				expect(mailSendMock).toHaveBeenCalledWith({
					data: {
						site: SITE,
						token: expect.any(String),
						user: res
					},
					template: "activate",
					to: res.email
				});

				savedUser3 = res;
				user3VerificationToken = mailSendMock.mock.calls[0][0].data.token;
			});

			it("should verify user3 with token", async () => {
				mailSendMock.mockClear();

				const res = await broker.call("accounts.verify", { token: user3VerificationToken });
				expect(res).toEqual({
					token: expect.any(String)
				});

				expect(mailSendMock).toHaveBeenCalledTimes(1);
				expect(mailSendMock).toHaveBeenCalledWith({
					data: {
						site: SITE,
						user: {
							...savedUser3,
							updatedAt: expect.any(Number),
							verified: true
						}
					},
					template: "welcome",
					to: savedUser3.email
				});

				await setConf(broker, "accounts.defaultRoles", ["user"]);
				await setConf(broker, "accounts.defaultPlan", "free");
			});

			it("should throw error for the same verification token", async () => {
				expect.assertions(3);
				try {
					await broker.call("accounts.verify", { token: user3VerificationToken });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(400);
					expect(err.type).toBe("INVALID_TOKEN");
				}
			});

			it("should throw error if verification token is not exist", async () => {
				expect.assertions(3);
				try {
					await broker.call("accounts.verify", { token: "12345678" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(400);
					expect(err.type).toBe("INVALID_TOKEN");
				}
			});
		});

		describe("Test 'login' action", () => {
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
					verificationToken = mailSendMock.mock.calls[0][0].data.token;
				});

				it("should not logged in with non-exist account", async () => {
					expect.assertions(3);
					try {
						await broker.call("accounts.login", {
							email: "no-user@kantab.io",
							password: "pass"
						});
					} catch (err) {
						expect(err).toBeInstanceOf(E.MoleculerClientError);
						expect(err.code).toBe(400);
						expect(err.type).toBe("ACCOUNT_NOT_FOUND");
					}
				});

				it("should not logged in unverified account", async () => {
					expect.assertions(3);
					try {
						await broker.call("accounts.login", {
							email: "user4@kantab.io",
							password: "password4"
						});
					} catch (err) {
						expect(err).toBeInstanceOf(E.MoleculerClientError);
						expect(err.code).toBe(400);
						expect(err.type).toBe("ACCOUNT_NOT_VERIFIED");
					}
				});

				it("verify account", async () => {
					await broker.call("accounts.verify", { token: verificationToken });
				});

				it("should not logged in with wrong password", async () => {
					expect.assertions(3);
					try {
						await broker.call("accounts.login", {
							email: "user4@kantab.io",
							password: "wrong-password"
						});
					} catch (err) {
						expect(err).toBeInstanceOf(E.MoleculerClientError);
						expect(err.code).toBe(400);
						expect(err.type).toBe("WRONG_PASSWORD");
					}
				});

				it("should not logged in with wrong email", async () => {
					expect.assertions(3);
					try {
						await broker.call("accounts.login", {
							email: "user44@kantab.io",
							password: "password4"
						});
					} catch (err) {
						expect(err).toBeInstanceOf(E.MoleculerClientError);
						expect(err.code).toBe(400);
						expect(err.type).toBe("ACCOUNT_NOT_FOUND");
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
					expect.assertions(3);
					await setConf(broker, "accounts.username.enabled", false);

					try {
						await broker.call("accounts.login", {
							email: "user4",
							password: "password4"
						});
					} catch (err) {
						expect(err).toBeInstanceOf(E.MoleculerClientError);
						expect(err.code).toBe(400);
						expect(err.type).toBe("ACCOUNT_NOT_FOUND");
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
					expect.assertions(3);
					await disableAccount(broker, savedUser.id);

					try {
						await broker.call("accounts.login", {
							email: "user4@kantab.io",
							password: "password4"
						});
					} catch (err) {
						expect(err).toBeInstanceOf(E.MoleculerClientError);
						expect(err.code).toBe(400);
						expect(err.type).toBe("ACCOUNT_DISABLED");
					}

					await enableAccount(broker, savedUser.id);
				});

				it("should not send magic-link email if no password and feature is disabled", async () => {
					await setConf(broker, "accounts.passwordless.enabled", false);
					expect.assertions(3);
					try {
						await broker.call("accounts.login", { email: "user4@kantab.io" });
					} catch (err) {
						expect(err).toBeInstanceOf(E.MoleculerClientError);
						expect(err.code).toBe(400);
						expect(err.type).toBe("PASSWORDLESS_DISABLED");
					}
				});

				it("should send magic-link email if no password and feature is enabled", async () => {
					mailSendMock.mockClear();
					await setConf(broker, "accounts.passwordless.enabled", true);
					const res = await broker.call("accounts.login", { email: "user4@kantab.io" });
					expect(res).toEqual({
						email: "user4@kantab.io",
						passwordless: true
					});

					expect(mailSendMock).toHaveBeenCalledTimes(1);
					expect(mailSendMock).toHaveBeenCalledWith({
						data: {
							site: SITE,
							token: expect.any(String),
							user: {
								...savedUser,
								updatedAt: expect.any(Number),
								verified: true
							}
						},
						template: "magic-link",
						to: savedUser.email
					});
				});
			});
		});
	});
});
