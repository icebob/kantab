"use strict";

const _ = require("lodash");
const { ServiceBroker, Context } = require("moleculer");
const TokensService = require("../../services/tokens.service");
const AccountsService = require("../../services/accounts.service");
const ConfigService = require("../../services/config.service");
const C = require("../../constants");
const E = require("moleculer").Errors;
const { EntityNotFoundError } = require("@moleculer/database").Errors;

const SITE = { name: "KanTab", url: "http://localhost:4000" };

const FindEntityMiddleware = require("../../middlewares/find-entity.middleware");
const CheckPermissionsMiddleware = require("../../middlewares/check-permissions.middleware");
const AsyncContextMiddleware = require("../../middlewares/async-context.middleware");

describe("Test Accounts service", () => {
	async function unverifiedAccount(svc, id) {
		await svc.updateEntity(null, { id, verified: false }, { permissive: true });
	}

	async function verifiedAccount(svc, id) {
		await svc.updateEntity(null, { id, verified: true }, { permissive: true });
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
					expect(err.type).toBe("SIGNUP_DISABLED");
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
					expect(err.type).toBe("EMAIL_EXISTS");
				}
			});

			it("should throw error if username is not exist but username is enabled", async () => {
				await setConf(broker, "accounts.username.enabled", true);

				expect.assertions(3);
				try {
					await broker.call("accounts.register", { ...user1, username: null });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(400);
					expect(err.type).toBe("USERNAME_EMPTY");
				}
			});

			it("should throw error if username is exist", async () => {
				expect.assertions(3);
				try {
					await broker.call("accounts.register", { ...user1, username: "test" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(400);
					expect(err.type).toBe("USERNAME_EXISTS");
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
					expect(err.type).toBe("PASSWORD_EMPTY");
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
					avatar: "https://gravatar.com/avatar/9b846cdc5f5eb743c4ef2c556a822d22?s=64&d=robohash"
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

		describe("with passwordless", () => {
			const user = {
				username: "user5",
				email: "user5@kantab.io",
				fullName: "User Five"
			};

			let savedUser, verificationToken;

			beforeAll(async () => {
				mailSendMock.mockClear();
				await setConf(broker, "accounts.passwordless.enabled", true);

				savedUser = await broker.call("accounts.register", user);
				verificationToken = mailSendMock.mock.calls[0][0].data.token;
			});

			it("should not logged in unverified account", async () => {
				expect.assertions(3);
				try {
					await broker.call("accounts.login", { email: "user5@kantab.io" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(400);
					expect(err.type).toBe("ACCOUNT_NOT_VERIFIED");
				}
			});

			it("verify account", async () => {
				await broker.call("accounts.verify", { token: verificationToken });
			});

			it("should not logged in with password", async () => {
				expect.assertions(3);
				try {
					await broker.call("accounts.login", {
						email: "user5@kantab.io",
						password: "some-password"
					});
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(400);
					expect(err.type).toBe("PASSWORDLESS_WITH_PASSWORD");
				}
			});

			it("should not logged in if mail sending is disabled", async () => {
				await setConf(broker, "mail.enabled", false);
				expect.assertions(3);
				try {
					await broker.call("accounts.login", { email: "user5@kantab.io" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(400);
					expect(err.type).toBe("PASSWORDLESS_UNAVAILABLE");
				}
				await setConf(broker, "mail.enabled", true);
			});

			it("should not logged in if passwordless feature is disabled", async () => {
				await setConf(broker, "accounts.passwordless.enabled", false);
				expect.assertions(3);
				try {
					await broker.call("accounts.login", { email: "user5@kantab.io" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(400);
					expect(err.type).toBe("PASSWORDLESS_DISABLED");
				}
				await setConf(broker, "accounts.passwordless.enabled", true);
			});

			it("should send magic-link email if email is exist", async () => {
				mailSendMock.mockClear();
				const res = await broker.call("accounts.login", { email: "user5@kantab.io" });
				expect(res).toEqual({
					email: "user5@kantab.io",
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

			it("should not logged in with username if this feature is disabled", async () => {
				expect.assertions(3);
				await setConf(broker, "accounts.username.enabled", false);

				try {
					await broker.call("accounts.login", {
						email: "user5",
						password: "password5"
					});
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(400);
					expect(err.type).toBe("ACCOUNT_NOT_FOUND");
				}
			});

			it("should send magic-link email if username is exist", async () => {
				await setConf(broker, "accounts.username.enabled", true);
				mailSendMock.mockClear();
				const res = await broker.call("accounts.login", { email: "user5" });
				expect(res).toEqual({
					email: "user5@kantab.io",
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

			it("should not logged in disabled account", async () => {
				expect.assertions(3);

				await disableAccount(broker, savedUser.id);

				try {
					await broker.call("accounts.login", { email: "user5@kantab.io" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(400);
					expect(err.type).toBe("ACCOUNT_DISABLED");
				}

				await enableAccount(broker, savedUser.id);
			});
		});

		describe("Test resolveToken", () => {
			let savedUser, token;

			beforeAll(async () => {
				savedUser = await service.findEntity(null, { query: { username: "test" } });
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
				expect.assertions(3);
				try {
					await broker.call("accounts.resolveToken", { token: "12345" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(401);
					expect(err.type).toBe("INVALID_TOKEN");
				}
			});

			it("should throw error if token is invalid", async () => {
				const wrongToken = await service.generateJWT({});
				expect.assertions(3);
				try {
					await broker.call("accounts.resolveToken", { token: wrongToken });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(401);
					expect(err.type).toBe("INVALID_TOKEN");
				}
			});

			it("should throw error if user is not found", async () => {
				const wrongToken = await service.generateJWT({ id: 1 });
				expect.assertions(3);
				try {
					await broker.call("accounts.resolveToken", { token: wrongToken });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(400);
					expect(err.type).toBe("ACCOUNT_NOT_FOUND");
				}
			});

			it("should throw error if account is not verified", async () => {
				await unverifiedAccount(service, savedUser.id);

				expect.assertions(3);
				try {
					await broker.call("accounts.resolveToken", { token });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(400);
					expect(err.type).toBe("ACCOUNT_NOT_VERIFIED");
				}

				await verifiedAccount(service, savedUser.id);
			});

			it("should throw error if account is disabled", async () => {
				await disableAccount(broker, savedUser.id);

				expect.assertions(3);
				try {
					await broker.call("accounts.resolveToken", { token });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(400);
					expect(err.type).toBe("ACCOUNT_DISABLED");
				}

				await enableAccount(broker, savedUser.id);
			});

			it("should return resolved user if token is valid", async () => {
				const res = await broker.call("accounts.resolveToken", { token });

				expect(res).toEqual({
					...savedUser,
					updatedAt: expect.any(Number)
				});
			});
		});

		describe("Test me", () => {
			let savedUser;

			beforeAll(async () => {
				savedUser = await service.findEntity(null, { query: { username: "test" } });
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
				await unverifiedAccount(service, savedUser.id);

				const res = await broker.call("accounts.me", null, {
					meta: { userID: savedUser.id }
				});
				expect(res).toBeNull();

				await verifiedAccount(service, savedUser.id);
			});

			it("should throw error if account is disabled", async () => {
				await disableAccount(broker, savedUser.id);

				const res = await broker.call("accounts.me", null, {
					meta: { userID: savedUser.id }
				});
				expect(res).toBeNull();

				await enableAccount(broker, savedUser.id);
			});

			it("should return user after enabling", async () => {
				const res = await broker.call("accounts.me", null, {
					meta: { userID: savedUser.id }
				});
				expect(res).toEqual({
					...savedUser,
					updatedAt: expect.any(Number)
				});
			});
		});

		describe("Test 'socialLogin' action", () => {
			describe("without logged in user", () => {
				const user = {
					username: "user6",
					password: "password6",
					email: "user6@kantab.io",
					fullName: "User Six"
				};

				let savedUser;

				beforeAll(async () => {
					await setConf(broker, "accounts.verification.enabled", true);

					savedUser = await broker.call("accounts.register", user);
				});

				it("should throw error if profile doesn't contain email", async () => {
					expect.assertions(3);
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
						expect(err.code).toBe(400);
						expect(err.type).toBe("NO_SOCIAL_EMAIL");
					}
				});

				it("should throw error if account is disabled", async () => {
					expect.assertions(3);
					await disableAccount(broker, savedUser.id);
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
						expect(err.code).toBe(400);
						expect(err.type).toBe("ACCOUNT_DISABLED");
					}
					await enableAccount(broker, savedUser.id);
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
						updatedAt: expect.any(Number),
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
						updatedAt: expect.any(Number),
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
						updatedAt: expect.any(Number),
						token: expect.any(String)
					});
				});

				it("should throw error if socialID not found & signup is disabled", async () => {
					await setConf(broker, "accounts.signup.enabled", false);
					expect.assertions(3);
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
						expect(err.code).toBe(400);
						expect(err.type).toBe("SIGNUP_DISABLED");
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
						passwordless: true,
						roles: ["user"],
						plan: "free",
						socialLinks: {
							google: 3000
						},
						createdAt: expect.any(Number),
						updatedAt: expect.any(Number),
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
					await setConf(broker, "accounts.verification.enabled", false);

					savedUser = await broker.call("accounts.register", user);
					meta = { userID: savedUser.id, user: savedUser };
				});

				it("should throw error if socialID is assigned to another account", async () => {
					expect.assertions(3);
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
						expect(err.code).toBe(400);
						expect(err.type).toBe("SOCIAL_ACCOUNT_MISMATCH");
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
						updatedAt: expect.any(Number),
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
						updatedAt: expect.any(Number),
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
						updatedAt: expect.any(Number),
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
				await setConf(broker, "accounts.verification.enabled", false);
				savedUser = await broker.call("accounts.register", user);
				delete savedUser.token;
			});

			it("should link user to google", async () => {
				const res = await broker.call(
					"accounts.link",
					{
						id: savedUser.id,
						provider: "google",
						profile: {
							socialID: 6000
						}
					},
					{ meta: { userID: savedUser.id } }
				);

				expect(res).toEqual({
					...savedUser,
					socialLinks: {
						google: 6000
					},
					updatedAt: expect.any(Number)
				});
			});

			it("should link user to facebook", async () => {
				const res = await broker.call(
					"accounts.link",
					{
						id: savedUser.id,
						provider: "facebook",
						profile: {
							socialID: 7000
						}
					},
					{ meta: { userID: savedUser.id } }
				);

				expect(res).toEqual({
					...savedUser,
					socialLinks: {
						google: 6000,
						facebook: 7000
					},
					updatedAt: expect.any(Number)
				});
			});

			it("should not unlink if no user", async () => {
				expect.assertions(3);
				try {
					await broker.call("accounts.unlink", {
						provider: "google"
					});
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(401);
					expect(err.type).toBe("ERR_HAS_NO_ACCESS");
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
						google: null,
						facebook: 7000
					},
					updatedAt: expect.any(Number)
				});
			});

			it("should unlink user from facebook", async () => {
				const res = await broker.call(
					"accounts.unlink",
					{
						id: savedUser.id,
						provider: "facebook"
					},
					{ meta: { userID: savedUser.id } }
				);

				expect(res).toEqual({
					...savedUser,
					socialLinks: {
						google: null,
						facebook: null
					},
					updatedAt: expect.any(Number)
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

			async function generatePasswordlessToken(id) {
				mailSendMock.mockClear();
				await service.sendMagicLink(new Context(broker), { id });
				return mailSendMock.mock.calls[0][0].data.token;
			}

			beforeAll(async () => {
				await setConf(broker, "accounts.verification.enabled", false);
				await setConf(broker, "accounts.passwordless.enabled", true);

				savedUser = await broker.call("accounts.register", user);
				delete savedUser.token;
			});

			it("should generate passwordless token", async () => {
				passwordlessToken = await generatePasswordlessToken(savedUser.id);
				expect(passwordlessToken).toBeDefined();
			});

			it("should throw error if passwordless is disabled", async () => {
				await setConf(broker, "accounts.passwordless.enabled", false);

				expect.assertions(3);
				try {
					await broker.call("accounts.passwordless", { token: "12345" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(400);
					expect(err.type).toBe("PASSWORDLESS_DISABLED");
				}

				await setConf(broker, "accounts.passwordless.enabled", true);
			});

			it("should throw error if token is not exist", async () => {
				expect.assertions(3);
				try {
					await broker.call("accounts.passwordless", { token: "12345" });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(400);
					expect(err.type).toBe("INVALID_TOKEN");
				}
			});

			it("should throw error if account is disabled", async () => {
				await disableAccount(broker, savedUser.id);

				expect.assertions(3);
				try {
					await broker.call("accounts.passwordless", { token: passwordlessToken });
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(400);
					expect(err.type).toBe("ACCOUNT_DISABLED");
				}

				await enableAccount(broker, savedUser.id);
			});

			it("should return token if token is valid and not expired", async () => {
				const res = await broker.call("accounts.passwordless", {
					token: passwordlessToken
				});

				expect(res).toEqual({
					token: expect.any(String)
				});
			});

			it("should return error for using token again", async () => {
				expect.assertions(3);
				try {
					await broker.call("accounts.passwordless", {
						token: passwordlessToken
					});
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(400);
					expect(err.type).toBe("INVALID_TOKEN");
				}
			});

			it("should verify account if it is not verified yet", async () => {
				passwordlessToken = await generatePasswordlessToken(savedUser.id);
				await unverifiedAccount(service, savedUser.id);

				const res = await broker.call("accounts.passwordless", {
					token: passwordlessToken
				});

				expect(res).toEqual({
					token: expect.any(String)
				});

				expect(await broker.call("accounts.resolve", { id: savedUser.id })).toEqual({
					...savedUser,
					verified: true,
					updatedAt: expect.any(Number)
				});
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

			async function generateResetPasswordToken(email) {
				mailSendMock.mockClear();
				await broker.call("accounts.forgotPassword", { email });
				return mailSendMock.mock.calls[0][0].data.token;
			}

			beforeAll(async () => {
				await setConf(broker, "accounts.verification.enabled", false);
				savedUser = await broker.call("accounts.register", user);
				delete savedUser.token;
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
					expect.assertions(3);
					try {
						await broker.call("accounts.forgotPassword", { email: "user12@kantab.io" });
					} catch (err) {
						expect(err).toBeInstanceOf(E.MoleculerClientError);
						expect(err.code).toBe(400);
						expect(err.type).toBe("ACCOUNT_NOT_FOUND");
					}
				});

				it("should throw error if account is not verified", async () => {
					await unverifiedAccount(service, savedUser.id);

					expect.assertions(3);
					try {
						await broker.call("accounts.forgotPassword", { email: "user11@kantab.io" });
					} catch (err) {
						expect(err).toBeInstanceOf(E.MoleculerClientError);
						expect(err.code).toBe(400);
						expect(err.type).toBe("ACCOUNT_NOT_VERIFIED");
					}

					await verifiedAccount(service, savedUser.id);
				});

				it("should throw error if account is disabled", async () => {
					await disableAccount(broker, savedUser.id);

					expect.assertions(3);
					try {
						await broker.call("accounts.forgotPassword", { email: "user11@kantab.io" });
					} catch (err) {
						expect(err).toBeInstanceOf(E.MoleculerClientError);
						expect(err.code).toBe(400);
						expect(err.type).toBe("ACCOUNT_DISABLED");
					}

					await enableAccount(broker, savedUser.id);
				});

				it("should generate token and call sendMail", async () => {
					mailSendMock.mockClear();

					const res = await broker.call("accounts.forgotPassword", {
						email: "user11@kantab.io"
					});

					expect(res).toBe(true);

					expect(mailSendMock).toHaveBeenCalledTimes(1);
					expect(mailSendMock).toHaveBeenCalledWith({
						data: {
							site: SITE,
							token: expect.any(String),
							user: {
								...savedUser,
								updatedAt: expect.any(Number)
							}
						},
						template: "reset-password",
						to: savedUser.email
					});
					resetToken = mailSendMock.mock.calls[0][0].data.token;
				});
			});

			describe("Test `resetPassword` action", () => {
				it("should throw error if token is not exist", async () => {
					expect.assertions(3);
					try {
						await broker.call("accounts.resetPassword", {
							token: "12345",
							password: "newpass1234"
						});
					} catch (err) {
						expect(err).toBeInstanceOf(E.MoleculerClientError);
						expect(err.code).toBe(400);
						expect(err.type).toBe("INVALID_TOKEN");
					}
				});

				it("should throw error if account is disabled", async () => {
					await disableAccount(broker, savedUser.id);

					expect.assertions(3);
					try {
						await broker.call("accounts.resetPassword", {
							token: resetToken,
							password: "newpass1234"
						});
					} catch (err) {
						expect(err).toBeInstanceOf(E.MoleculerClientError);
						expect(err.code).toBe(400);
						expect(err.type).toBe("ACCOUNT_DISABLED");
					}

					await enableAccount(broker, savedUser.id);
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
					expect(mailSendMock).toHaveBeenCalledWith({
						data: {
							site: SITE,
							user: {
								...savedUser,
								updatedAt: expect.any(Number)
							}
						},
						template: "password-changed",
						to: savedUser.email
					});
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
				email: "user12@kantab.io",
				password: "password12",
				fullName: "User Twelve"
			};

			const adminMeta = {
				meta: {
					roles: [C.ROLE_ADMINISTRATOR]
				}
			};

			let savedUser;

			beforeAll(async () => {
				await setConf(broker, "accounts.username.enabled", false);
				await setConf(broker, "accounts.verification.enabled", false);
			});

			it("should not contain username if this feature is disabled", async () => {
				savedUser = await broker.call("accounts.register", user);
				expect(savedUser.username).toBeUndefined();
			});

			it("should throw error if user not found", async () => {
				expect.assertions(3);
				try {
					await broker.call("accounts.disable", { id: "1234" }, adminMeta);
				} catch (err) {
					expect(err).toBeInstanceOf(EntityNotFoundError);
					expect(err.code).toBe(404);
					expect(err.type).toBe("ENTITY_NOT_FOUND");
				}
			});

			it("should disable account", async () => {
				const res = await broker.call("accounts.disable", { id: savedUser.id }, adminMeta);

				expect(res).toEqual({
					...savedUser,
					token: undefined,
					updatedAt: expect.any(Number),
					status: 0
				});
			});

			it("should throw error if account has been already disabled", async () => {
				expect.assertions(3);
				try {
					await broker.call("accounts.disable", { id: savedUser.id }, adminMeta);
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_USER_ALREADY_DISABLED");
				}
			});

			it("should throw error if user not found", async () => {
				expect.assertions(3);
				try {
					await broker.call("accounts.enable", { id: "1234" }, adminMeta);
				} catch (err) {
					expect(err).toBeInstanceOf(EntityNotFoundError);
					expect(err.code).toBe(404);
					expect(err.type).toBe("ENTITY_NOT_FOUND");
				}
			});

			it("should enable account", async () => {
				const res = await broker.call("accounts.enable", { id: savedUser.id }, adminMeta);

				expect(res).toEqual({
					id: savedUser.id,
					status: 1
				});
			});

			it("should throw error if account has been already enabled", async () => {
				expect.assertions(4);
				try {
					await broker.call("accounts.enable", { id: savedUser.id }, adminMeta);
				} catch (err) {
					expect(err).toBeInstanceOf(E.MoleculerClientError);
					expect(err.name).toBe("MoleculerClientError");
					expect(err.code).toBe(400);
					expect(err.type).toBe("ERR_USER_ALREADY_ENABLED");
				}
			});
		});
	});
});
