"use strict";

const crypto = require("crypto");
const bcrypt = require("bcrypt");
const _ = require("lodash");

const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");

const DbService = require("../mixins/db.mixin");
const { generateValidatorSchemaFromFields } = require("@moleculer/database");
const ConfigLoader = require("../mixins/config.mixin");
const { MoleculerRetryableError, MoleculerClientError } = require("moleculer").Errors;
const C = require("../constants");

const HASH_SALT_ROUND = 10;
const TOKEN_EXPIRATION = 60 * 60 * 1000; // 1 hour

const TESTING = process.env.NODE_ENV === "test";

const FIELDS = {
	id: { type: "string", primaryKey: true, secure: true, columnName: "_id" },
	username: { type: "string", max: 50, empty: false, required: false, trim: true },
	fullName: { type: "string", max: 100, empty: false, required: true, trim: true },
	email: {
		type: "email",
		max: 254,
		empty: false,
		required: true,
		trim: true,
		graphql: { type: "String" }
	},
	password: { type: "string", min: 6, max: 60, hidden: true },
	passwordless: { type: "boolean", readonly: true, default: false },
	avatar: { type: "string", max: 255 },
	roles: {
		type: "array",
		items: { type: "string", empty: false },
		default() {
			return this.config["accounts.defaultRoles"];
		}
	},
	socialLinks: {
		type: "object",
		readonly: true,
		default: () => ({}),
		//graphql: { type: "JSON" }
		properties: {
			github: { type: "String" },
			google: { type: "String" },
			facebook: { type: "String" }
		}
	},
	status: { type: "number", readonly: true, default: 1 },
	plan: {
		type: "string",
		readonly: true,
		default() {
			return this.config["accounts.defaultPlan"];
		}
	},
	verified: { type: "boolean", readonly: true, default: false },
	token: { type: "string", readonly: true, virtual: true }, // filled only in login response
	totp: {
		type: "object",
		readonly: true,
		properties: {
			enabled: { type: "boolean", default: false },
			secret: { type: "string", hidden: true }
		}
	},
	...C.TIMESTAMP_FIELDS,
	lastLoginAt: { type: "number", readonly: true, graphql: { type: "Long" } }
};

/**
 * Account service
 */
module.exports = {
	name: "accounts",
	version: 1,

	mixins: [
		DbService({ actionVisibility: C.VISIBILITY_PROTECTED }),
		ConfigLoader(["site.**", "mail.**", "accounts.**"])
	],

	/**
	 * Service dependencies
	 */
	dependencies: [],

	/**
	 * Service settings
	 */
	settings: {
		rest: true,

		actions: {
			sendMail: "v1.mail.send"
		},

		fields: FIELDS,

		indexes: [
			{ fields: "username", unique: true },
			{ fields: "email", unique: true }
		],

		graphql: {
			entityName: "Profile",

			type: `
				type LoginResponse {
					token: String
					passwordless: Boolean
					email: String
				}

				type Enable2FAResponse {
					otpauthURL: String!
					secret: String!
				}

				type Member {
					id: String!
					username: String
					fullName: String!
					avatar: String
				}
			`,
			resolvers: {
				/*User: {
					boards: {
						action: "v1.boards.find",
						rootParams: {
							id: "query.owner"
						}
					},
					boardCount: {
						action: "v1.boards.count",
						rootParams: {
							id: "query.owner"
						}
					}
				}*/
			}
		}
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Get user by JWT token (for API GW authentication)
		 *
		 * @actions
		 * @param {String} token - JWT token
		 *
		 * @returns {Object} Resolved user
		 */
		resolveToken: {
			visibility: "public",
			cache: {
				keys: ["token"],
				ttl: 60 * 60 // 1 hour
			},
			params: {
				token: "string"
			},
			async handler(ctx) {
				const decoded = await this.verifyJWT(ctx.params.token);
				if (!decoded.id)
					throw new MoleculerClientError("Invalid token", 401, "INVALID_TOKEN");

				const user = await this.resolveEntities(ctx, decoded, { transform: false });
				this.checkUser(user);

				return await this.transformResult(null, user, {}, ctx);
			}
		},

		/**
		 * Get current user entity.
		 *
		 * @actions
		 *
		 * @returns {Object} User entity
		 */
		me: {
			description: "Get the logged in user's profile",
			cache: {
				keys: ["#userID"]
			},
			rest: "GET /me",
			graphql: {
				query: "me: Profile"
			},
			async handler(ctx) {
				if (!ctx.meta.userID) return null;

				const user = await this.resolveEntities(ctx, { id: ctx.meta.userID });
				try {
					this.checkUser(user);
					return user;
				} catch (err) {
					return null;
				}
			}
		},

		/**
		 * Register a new user account
		 *
		 */
		register: {
			description: "Register a new user account",
			params: generateValidatorSchemaFromFields(
				_.pick(FIELDS, ["username", "fullName", "email", "password", "avatar"]),
				{ type: "create" }
			),
			rest: "POST /register",
			graphql: {
				mutation: `register(username: String!, fullName: String!, email: String!, password: String, avatar: String): Profile!`
			},
			async handler(ctx) {
				if (!this.config["accounts.signup.enabled"])
					throw new MoleculerClientError(
						"Sign up is not available.",
						400,
						"SIGNUP_DISABLED"
					);

				const entity = Object.assign({}, ctx.params);

				// Verify email
				let found = await this.getUserByEmail(ctx, entity.email);
				if (found)
					throw new MoleculerClientError(
						"Email has already been registered.",
						400,
						"EMAIL_EXISTS"
					);

				// Verify username
				if (this.config["accounts.username.enabled"]) {
					if (!entity.username) {
						throw new MoleculerClientError(
							"Username can't be empty.",
							400,
							"USERNAME_EMPTY"
						);
					}

					let found = await this.getUserByUsername(ctx, entity.username);
					if (found)
						throw new MoleculerClientError(
							"Username has already been registered.",
							400,
							"USERNAME_EXISTS"
						);
				} else {
					// Usename is not enabled
					delete entity.username;
				}

				if (!entity.avatar) {
					// Default avatar as Gravatar
					const md5 = crypto.createHash("md5").update(entity.email).digest("hex");
					entity.avatar = `https://gravatar.com/avatar/${md5}?s=64&d=robohash`;
				}

				// Generate passwordless token or hash password
				if (entity.password) {
					entity.passwordless = false;
					entity.password = await bcrypt.hash(entity.password, 10);
				} else if (this.config["accounts.passwordless.enabled"]) {
					entity.passwordless = true;
					entity.password = null;
				} else {
					throw new MoleculerClientError(
						"Password can't be empty.",
						400,
						"PASSWORD_EMPTY"
					);
				}

				// Generate verification token
				entity.verified = !this.config["accounts.verification.enabled"];

				// Create new user
				const user = await this.createEntity(ctx, entity, { permissive: true });

				// Send email
				if (user.verified) {
					// Send welcome email
					this.sendMail(ctx, user, "welcome");
					user.token = await this.getToken(user);
				} else {
					const token = await this.generateToken(
						C.TOKEN_TYPE_VERIFICATION,
						user.id,
						TOKEN_EXPIRATION
					);
					// Send verification email
					this.sendMail(ctx, user, "activate", { token });
				}

				return user;
			}
		},

		/**
		 * Verify an account
		 */
		verify: {
			description: "Verify an account",
			params: {
				token: { type: "string" }
			},
			rest: "POST /verify",
			graphql: {
				mutation: `accountVerify(token: String!): LoginResponse!`
			},
			async handler(ctx) {
				const token = await ctx.call("v1.tokens.check", {
					type: C.TOKEN_TYPE_VERIFICATION,
					token: ctx.params.token
				});
				if (!token) {
					throw new MoleculerClientError(
						"Invalid or expired verification token.",
						400,
						"INVALID_TOKEN"
					);
				}

				let user = await this.resolveEntities(ctx, { id: token.owner });
				this.checkUser(user, { noVerification: true });

				user = await this.updateEntity(
					ctx,
					{
						id: token.owner,
						verified: true
					},
					{ permissive: true }
				);

				// Remove token
				await ctx.call("v1.tokens.remove", {
					type: C.TOKEN_TYPE_VERIFICATION,
					token: ctx.params.token
				});

				// Send welcome email
				// No need to wait it.
				this.sendMail(ctx, user, "welcome");

				return {
					token: await this.getToken(user)
				};
			}
		},

		/**
		 * Disable an account
		 */
		disable: {
			description: "Disable an account",
			permissions: [C.ROLE_ADMINISTRATOR],
			params: {
				id: { type: "string" }
			},
			needEntity: true,
			// graphql: {
			// 	mutation: `accountDisable(id: String!): Profile!`
			// },
			async handler(ctx) {
				const user = ctx.locals.entity;
				if (user.status == 0)
					throw new MoleculerClientError(
						"Account has already been disabled.",
						400,
						"ERR_USER_ALREADY_DISABLED"
					);

				const res = await this.updateEntity(
					ctx,
					{
						id: user.id,
						status: 0
					},
					{ permissive: true }
				);

				return res;
			}
		},

		/**
		 * Enable an account
		 */
		enable: {
			description: "Enable an account",
			permissions: [C.ROLE_ADMINISTRATOR],
			params: {
				id: { type: "string" }
			},
			needEntity: true,
			// graphql: {
			// 	mutation: `accountEnable(id: String!): Account!`
			// },
			async handler(ctx) {
				const user = ctx.locals.entity;
				if (user.status == 1)
					throw new MoleculerClientError(
						"Account has already been enabled.",
						400,
						"ERR_USER_ALREADY_ENABLED"
					);

				const res = await this.updateEntity(
					ctx,
					{
						id: user.id,
						status: 1
					},
					{ permissive: true }
				);

				return {
					id: user.id,
					status: res.status
				};
			}
		},

		/**
		 * Handle local login
		 */
		login: {
			description: "Login with local account",
			params: {
				email: { type: "string", optional: false },
				password: { type: "string", optional: true },
				token: { type: "string", optional: true, convert: true }
			},
			rest: "POST /login",
			graphql: {
				mutation: "login(email: String!, password: String, token: String): LoginResponse!"
			},
			async handler(ctx) {
				// Get user by email
				let _user = await this.getUserByEmail(ctx, ctx.params.email, { transform: false });

				if (!_user && this.config["accounts.username.enabled"]) {
					// Get user by username
					_user = await this.getUserByUsername(ctx, ctx.params.email, {
						transform: false
					});
				}

				this.checkUser(_user);

				// Check passwordless login
				if (_user.passwordless == true && ctx.params.password) {
					throw new MoleculerClientError(
						"This is a passwordless account. Please login without password.",
						400,
						"PASSWORDLESS_WITH_PASSWORD"
					);
				}

				const user = await this.transformResult(null, _user, {}, ctx);

				// Authenticate
				if (ctx.params.password) {
					// Login with password
					if (!(await bcrypt.compare(ctx.params.password, _user.password))) {
						throw new MoleculerClientError("Wrong password.", 400, "WRONG_PASSWORD");
					}
				} else if (this.config["accounts.passwordless.enabled"]) {
					if (!this.config["mail.enabled"]) {
						throw new MoleculerClientError(
							"Passwordless login is not available because mail transporter is not configured.",
							400,
							"PASSWORDLESS_UNAVAILABLE"
						);
					}

					// Send magic link
					await this.sendMagicLink(ctx, user);

					return {
						passwordless: true,
						email: user.email
					};
				} else {
					throw new MoleculerClientError(
						"Passwordless login is not allowed.",
						400,
						"PASSWORDLESS_DISABLED"
					);
				}

				// Check Two-factor authentication
				if (_user.totp && _user.totp.enabled) {
					if (!ctx.params.token) {
						throw new MoleculerClientError(
							"Two-factor authentication is enabled. Please give the 2FA code.",
							400,
							"ERR_MISSING_2FA_CODE"
						);
					}

					if (!(await this.verify2FA(_user.totp.secret, ctx.params.token))) {
						throw new MoleculerClientError(
							"Invalid 2FA token.",
							400,
							"TWOFACTOR_INVALID_TOKEN"
						);
					}
				}

				return {
					token: await this.getToken(user)
				};
			}
		},

		/**
		 * Handle social login.
		 */
		socialLogin: {
			params: {
				provider: { type: "string" },
				profile: { type: "object" },
				accessToken: { type: "string" },
				refreshToken: { type: "string", optional: true }
			},
			async handler(ctx) {
				const { provider, profile } = ctx.params;

				const query = { [`socialLinks.${provider}`]: profile.socialID };
				if (ctx.meta.user) {
					// There is logged in user. Link to the logged in user
					let user = await this.findEntity(ctx, { query });
					if (user) {
						if (user.id != ctx.meta.userID)
							throw new MoleculerClientError(
								"This social account has been linked to another account.",
								400,
								"SOCIAL_ACCOUNT_MISMATCH"
							);

						// Same user
						user.token = await this.getToken(user);
						return user;
					} else {
						// Not found linked account. Create the link
						user = await this.link(ctx, ctx.meta.userID, provider, profile);

						user.token = await this.getToken(user);
						return user;
					}
				} else {
					// No logged in user
					if (!profile.email) {
						throw new MoleculerClientError(
							"Missing e-mail address in social profile",
							400,
							"NO_SOCIAL_EMAIL"
						);
					}

					let foundBySocialID = false;

					let user = await this.findEntity(ctx, { query });
					if (user) {
						// User found.
						foundBySocialID = true;
					} else {
						// Try to search user by email
						user = await this.getUserByEmail(ctx, profile.email);
					}

					if (user) {
						// Check status
						if (user.status !== 1) {
							throw new MoleculerClientError(
								"Account is disabled.",
								400,
								"ACCOUNT_DISABLED"
							);
						}

						// Found the user by email.

						if (!foundBySocialID) {
							// Not found linked account. Create the link
							user = await this.link(ctx, user.id, provider, profile);
						}

						user.token = await this.getToken(user);

						return user;
					}

					if (!this.config["accounts.signup.enabled"])
						throw new MoleculerClientError(
							"Sign up is not available",
							400,
							"SIGNUP_DISABLED"
						);

					// Create a new user and link
					user = await ctx.call(`${this.fullName}.register`, {
						username: profile.username || profile.email.split("@")[0],
						password: null,
						email: profile.email,
						fullName: profile.fullName,
						avatar: profile.avatar
					});

					user = await this.link(ctx, user.id, provider, profile);

					user.token = await this.getToken(user);

					return user;
				}
			}
		},

		/**
		 * Check passwordless token
		 */
		passwordless: {
			description: "Login with passwordless token (magic-link)",
			params: {
				token: { type: "string" }
			},
			rest: "POST /passwordless",
			graphql: {
				mutation: `passwordlessLogin(token: String!): LoginResponse!`
			},
			async handler(ctx) {
				if (!this.config["accounts.passwordless.enabled"])
					throw new MoleculerClientError(
						"Passwordless login is not allowed.",
						400,
						"PASSWORDLESS_DISABLED"
					);

				const token = await ctx.call("v1.tokens.check", {
					type: C.TOKEN_TYPE_PASSWORDLESS,
					token: ctx.params.token
				});
				if (!token)
					throw new MoleculerClientError(
						"Invalid or expired passwordless token.",
						400,
						"INVALID_TOKEN"
					);

				const user = await this.resolveEntities(ctx, { id: token.owner });

				// Check status
				if (user.status !== 1) {
					throw new MoleculerClientError("Account is disabled.", 400, "ACCOUNT_DISABLED");
				}

				// Verified account if not
				if (!user.verified) {
					await this.updateEntity(
						ctx,
						{
							id: user.id,
							verified: true
						},
						{ permissive: true }
					);
				}

				// Remove token
				await ctx.call("v1.tokens.remove", {
					type: C.TOKEN_TYPE_PASSWORDLESS,
					token: ctx.params.token
				});

				return {
					token: await this.getToken(user)
				};
			}
		},

		/**
		 * Start "forgot password" process
		 */
		forgotPassword: {
			description: "Start the 'forgot password' process",
			params: {
				email: { type: "email" }
			},
			rest: "POST /forgot-password",
			graphql: {
				mutation: `forgotPassword(email: String!): Boolean!`
			},
			async handler(ctx) {
				const user = await this.getUserByEmail(ctx, ctx.params.email);
				this.checkUser(user);

				// Generate a reset token
				const token = await this.generateToken(
					C.TOKEN_TYPE_PASSWORD_RESET,
					user.id,
					TOKEN_EXPIRATION
				);

				// Send a passwordReset email
				await this.sendMail(ctx, user, "reset-password", { token });

				return true;
			}
		},

		/**
		 * Reset password
		 */
		resetPassword: {
			description: "Reset forgotten password",
			params: {
				token: { type: "string" },
				password: FIELDS.password
			},
			rest: "POST /reset-password",
			graphql: {
				mutation: `resetPassword(token: String! password: String!): LoginResponse!`
			},
			async handler(ctx) {
				const token = await ctx.call("v1.tokens.check", {
					type: C.TOKEN_TYPE_PASSWORD_RESET,
					token: ctx.params.token
				});
				if (!token) {
					throw new MoleculerClientError(
						"Invalid or expired password reset token.",
						400,
						"INVALID_TOKEN"
					);
				}

				let user = await this.resolveEntities(ctx, { id: token.owner });
				this.checkUser(user, { noVerification: true });

				// Change the password
				user = await this.updateEntity(
					ctx,
					{
						id: user.id,
						password: await this.hashPassword(ctx.params.password),
						passwordless: false,
						verified: true
					},
					{ permissive: true }
				);

				// Remove token
				await ctx.call("v1.tokens.remove", {
					type: C.TOKEN_TYPE_PASSWORD_RESET,
					token: ctx.params.token
				});

				// Send password-changed email
				this.sendMail(ctx, user, "password-changed");

				return {
					token: await this.getToken(user)
				};
			}
		},

		/**
		 * Link account to a social account
		 */
		link: {
			description: "Link account to a social account",
			permissions: [C.ROLE_AUTHENTICATED],
			params: {
				id: { type: "string", optional: true },
				provider: { type: "string" },
				profile: { type: "object" }
			},
			graphql: {
				mutation: `accountLink(id: String, provider: String, profile: JSON): Profile!`
			},

			async handler(ctx) {
				const id = ctx.params.id ? ctx.params.id : ctx.meta.userID;
				if (!id) throw new MoleculerClientError("Missing user ID.", 400, "MISSING_USER_ID");

				return await this.link(ctx, ctx.params.id, ctx.params.provider, ctx.params.profile);
			}
		},

		/**
		 * Unlink account from a social account
		 */
		unlink: {
			description: "Unlink account from a social account",
			permissions: [C.ROLE_AUTHENTICATED],
			rest: "GET /unlink",
			params: {
				id: { type: "string", optional: true },
				provider: { type: "string" }
			},
			graphql: {
				mutation: `accountUnlink(id: String, provider: String): Profile!`
			},

			async handler(ctx) {
				const id = ctx.params.id ? ctx.params.id : ctx.meta.userID;
				if (!id) throw new MoleculerClientError("Missing user ID.", 400, "MISSING_USER_ID");

				return await this.unlink(ctx, id, ctx.params.provider);
			}
		},

		/**
		 * Enable Two-Factor authentication (2FA)
		 */
		enable2Fa: {
			description: "Enable Two-Factor authentication (2FA)",
			permissions: [C.ROLE_AUTHENTICATED],
			rest: "POST /enable2fa",
			graphql: {
				mutation: `accountEnable2FA: Enable2FAResponse!`
			},
			async handler(ctx) {
				const _user = await this.resolveEntities(
					ctx,
					{ id: ctx.meta.userID },
					{ transform: false }
				);
				this.checkUser(_user);

				// Generate a TOTP secret and send back otpauthURL & secret
				const secret = speakeasy.generateSecret({ length: 10 });
				await this.updateEntity(
					ctx,
					{
						id: ctx.meta.userID,
						totp: {
							enabled: false,
							secret: secret.base32
						}
					},
					{ permissive: true }
				);

				const otpauthURL = speakeasy.otpauthURL({
					secret: secret.ascii,
					label: _user.email,
					issuer: this.configObj.site.name
				});

				return {
					secret: secret.base32,
					otpauthURL
				};
			}
		},

		/**
		 * Finalize Two-Factor authentication (2FA)
		 */
		finalize2Fa: {
			description: "Finalize Two-Factor authentication (2FA)",
			permissions: [C.ROLE_AUTHENTICATED],
			params: {
				token: { type: "string", optional: true, convert: true }
			},
			rest: "POST /finalize2Fa",
			graphql: {
				mutation: `accountFinalize2FA(token: String): Boolean!`
			},
			async handler(ctx) {
				const _user = await this.resolveEntities(
					ctx,
					{ id: ctx.meta.userID },
					{ transform: false }
				);
				this.checkUser(_user);

				// Verify the token with secret
				if (!(await this.verify2FA(_user.totp.secret, ctx.params.token))) {
					throw new MoleculerClientError(
						"Invalid token.",
						400,
						"TWOFACTOR_INVALID_TOKEN"
					);
				}

				await this.updateEntity(
					ctx,
					{
						id: ctx.meta.userID,
						totp: {
							enabled: true
						}
					},
					{ permissive: true }
				);

				return true;
			}
		},

		/**
		 * Disable Two-Factor authentication (2FA)
		 */
		disable2Fa: {
			description: "Disable Two-Factor authentication (2FA)",
			permissions: [C.ROLE_AUTHENTICATED],
			params: {
				token: { type: "string", convert: true }
			},
			rest: "GET /disable2fa",
			graphql: {
				mutation: `accountDisable2FA(token: String!): Boolean!`
			},
			async handler(ctx) {
				const _user = await this.resolveEntities(
					ctx,
					{ id: ctx.meta.userID },
					{ transform: false }
				);
				this.checkUser(_user);

				if (!_user.totp || !_user.totp.enabled)
					throw new MoleculerClientError(
						"Two-factor authentication is not enabled.",
						400,
						"TWOFACTOR_NOT_ENABLED"
					);

				const secret = _user.totp.secret;
				if (!(await this.verify2FA(secret, ctx.params.token))) {
					throw new MoleculerClientError(
						"Invalid token.",
						400,
						"TWOFACTOR_INVALID_TOKEN"
					);
				}

				await this.updateEntity(
					ctx,
					{
						id: ctx.meta.userID,
						totp: {
							enabled: false,
							secret: null
						}
					},
					{ permissive: true }
				);

				return true;
			}
		},

		/**
		 * Generate a Two-Factor authentication token (TOTP)
		 * For tests
		 */
		generate2FaToken: {
			visibility: "protected",
			params: {
				id: "string"
			},
			async handler(ctx) {
				const user = await this.resolveEntities(ctx, ctx.params, { transform: false });
				this.checkUser(user);

				if (!user.totp || !user.totp.secret) {
					throw new MoleculerClientError(
						"Two-factor authentication is not enabled.",
						400,
						"TWOFACTOR_NOT_ENABLED"
					);
				}

				const secret = user.totp.secret;
				const token = this.generate2FaToken(secret);

				return { token };
			}
		}
	},

	/**
	 * Events
	 */
	events: {},

	/**
	 * Methods
	 */
	methods: {
		/**
		 * Check the user fields (verified, status)
		 * @param {Object} user
		 * @param {Object?} opts
		 */
		checkUser(user, opts = {}) {
			if (!user) {
				throw new MoleculerClientError(
					"Account is not registered.",
					400,
					"ACCOUNT_NOT_FOUND"
				);
			}

			if (!opts.noVerification && !user.verified) {
				throw new MoleculerClientError(
					"Please activate your account.",
					400,
					"ACCOUNT_NOT_VERIFIED"
				);
			}

			if (user.status !== 1) {
				throw new MoleculerClientError("Account is disabled.", 400, "ACCOUNT_DISABLED");
			}
		},

		/**
		 * Generate a JWT login for user.
		 * @param {Object} user
		 * @returns {String}
		 */
		async getToken(user) {
			return await this.generateJWT({ id: user.id.toString() });
		},

		/**
		 * Generate a JWT token from user entity.
		 *
		 * @param {Object} payload
		 * @param {String|Number} [expiresIn]
		 */
		generateJWT(payload, expiresIn) {
			return new this.Promise((resolve, reject) => {
				return jwt.sign(
					payload,
					process.env.JWT_SECRET,
					{ expiresIn: expiresIn || this.config["accounts.jwt.expiresIn"] },
					(err, token) => {
						if (err) {
							this.logger.warn("JWT token generation error:", err);
							return reject(
								new MoleculerRetryableError(
									"Unable to generate token",
									500,
									"UNABLE_GENERATE_TOKEN"
								)
							);
						}

						resolve(token);
					}
				);
			});
		},

		/**
		 * Verify a JWT token and return the decoded payload
		 *
		 * @param {String} token
		 */
		verifyJWT(token) {
			return new this.Promise((resolve, reject) => {
				jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
					if (err) {
						this.logger.warn("JWT verifying error:", err);
						return reject(
							new MoleculerClientError("Invalid token", 401, "INVALID_TOKEN")
						);
					}

					resolve(decoded);
				});
			});
		},

		async link(ctx, id, provider, profile) {
			return await this.updateEntity(
				ctx,
				{
					id,
					socialLinks: {
						[provider]: profile.socialID
					},
					verified: true // if not verified yet via email
				},
				{ permissive: true }
			);
		},

		/**
		 * Unlink account from a social account
		 */
		async unlink(ctx, id, provider) {
			return await this.updateEntity(
				ctx,
				{
					id,
					socialLinks: {
						[provider]: null
					}
				},
				{ permissive: true }
			);
		},

		/**
		 * Send login magic link to user email
		 *
		 * @param {Context} ctx
		 * @param {Object} user
		 */
		async sendMagicLink(ctx, user) {
			const token = await this.generateToken(
				C.TOKEN_TYPE_PASSWORDLESS,
				user.id,
				TOKEN_EXPIRATION
			);

			return await this.sendMail(ctx, user, "magic-link", { token });
		},

		/**
		 * Send email to the user email address
		 *
		 * @param {Context} ctx
		 * @param {Object} user
		 * @param {String} template
		 * @param {Object?} data
		 */
		async sendMail(ctx, user, template, data) {
			if (!this.config["mail.enabled"]) return this.Promise.resolve(false);

			try {
				return await ctx.call(
					this.settings.actions.sendMail,
					{
						to: user.email,
						template,
						data: _.defaultsDeep(data, {
							user,
							site: this.configObj.site
						})
					},
					{ retries: 3, timeout: 10 * 1000 }
				);
			} catch (err) {
				/* istanbul ignore next */
				this.logger.error("Send mail error.", err);
				/* istanbul ignore next */
				throw err;
			}
		},

		/**
		 * Get user by email
		 *
		 * @param {Context} ctx
		 * @param {String} email
		 * @param {Object?} opts
		 */
		async getUserByEmail(ctx, email, opts) {
			return await this.findEntity(ctx, { query: { email } }, opts);
		},

		/**
		 * Get user by username
		 *
		 * @param {Context} ctx
		 * @param {String} username
		 * @param {Object?} opts
		 */
		async getUserByUsername(ctx, username, opts) {
			return await this.findEntity(ctx, { query: { username } }, opts);
		},

		/**
		 * Generate a token for user
		 *
		 * @param {String} type
		 * @param {String} owner
		 * @param {Number?} expiration
		 */
		async generateToken(type, owner, expiration) {
			const res = await (this.getContext() || this.broker).call("v1.tokens.generate", {
				type,
				owner,
				expiry: expiration ? Date.now() + expiration : null
			});

			return res.token;
		},

		/**
		 * Hashing a plaintext password
		 *
		 * @param {String} pass
		 * @returns {Promise} hashed password
		 */
		async hashPassword(pass) {
			return bcrypt.hash(pass, HASH_SALT_ROUND);
		},

		/**
		 * Verify 2FA token
		 *
		 * @param {String} secret
		 * @param {String} token
		 * @returns {Promise<Boolean>}
		 */
		async verify2FA(secret, token) {
			return speakeasy.totp.verify({
				secret,
				encoding: "base32",
				token,
				window: 2
			});
		},

		/**
		 * Generate a TOTP token
		 *
		 * @param {String} secret
		 * @returns {Promise<String>}
		 */
		async generate2FaToken(secret) {
			return speakeasy.totp({
				secret,
				encoding: "base32"
			});
		},

		/**
		 * Seed an empty collection with an `admin` and a `test` users.
		 */
		async seedDB() {
			const res = await this.createEntities(
				null,
				[
					// Administrator
					{
						username: "admin",
						fullName: "Administrator",
						email: "admin@kantab.io",
						password: await this.hashPassword("admin"),
						avatar: "https://user-images.githubusercontent.com/306521/112635269-e7511f00-8e3b-11eb-8a59-df6dda998d05.png",
						roles: ["administrator"],
						plan: "full",
						verified: true
					},

					// Test user
					{
						username: "test",
						fullName: "Test User",
						email: "test@kantab.io",
						password: await this.hashPassword("test"),
						avatar: "https://user-images.githubusercontent.com/306521/112635366-03ed5700-8e3c-11eb-80a3-49804bf7e7c4.png",
						verified: true
					}
				],
				{ permissive: true }
			);

			this.logger.info(`Generated ${res.length} users.`);
		}
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		if (!process.env.JWT_SECRET) {
			if (TESTING || process.env.TEST_E2E) {
				process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
			} else {
				this.broker.fatal("Environment variable 'JWT_SECRET' must be configured!");
			}
		}
	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {}
};
