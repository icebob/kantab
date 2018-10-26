"use strict";

const crypto 		= require("crypto");
const bcrypt 		= require("bcrypt");
const _ 			= require("lodash");

const jwt 			= require("jsonwebtoken");
const speakeasy		= require("speakeasy");

const DbService 	= require("../mixins/db.mixin");
const CacheCleaner 	= require("../mixins/cache.cleaner.mixin");
const ConfigLoader 	= require("../mixins/config.mixin");
const { MoleculerRetryableError, MoleculerClientError } = require("moleculer").Errors;
const C 			= require("../constants");

const HASH_SALT_ROUND = 10;

/**
 * Account service
 */
module.exports = {
	name: "accounts",
	version: 1,

	mixins: [
		DbService("accounts"),
		CacheCleaner([
			"cache.clean.accounts"
		]),
		ConfigLoader([
			"site.**",
			"mail.**",
			"accounts.**"
		])
	],

	/**
	 * Service dependencies
	 */
	dependencies: [
	],

	/**
	 * Service settings
	 */
	settings: {
		actions: {
			sendMail: "mail.send"
		},

		fields: [
			{ name: "_id", id: true },
			{ name: "username" },
			{ name: "firstName" },
			{ name: "lastName" },
			{ name: "email" },
			{ name: "avatar" },
			{ name: "roles" },
			{ name: "socialLinks" },
			{ name: "status", default: 1 },
			{ name: "plan" },
			{ name: "verified", default: false },
			{ name: "token", readonly: true, optional: true },
			{ name: "totp.enabled", optional: true },
			{ name: "passwordless", default: false },
			{ name: "passwordlessTokenExpires", hidden: true, optional: true },
			{ name: "resetTokenExpires", hidden: true, optional: true },
			{ name: "verificationToken", hidden: true, optional: true },
			{ name: "createdAt", type: "number", updateable: false, default: Date.now },
			{ name: "updatedAt", type: "number", readonly: true, updateDefault: () => Date.now },
			{ name: "lastLoginAt", type: "date", optional: true },
		]
	},

	/**
	 * Actions
	 */
	actions: {
		// Change visibility of default actions
		create: {
			visibility: C.VISIBILITY_PROTECTED
		},
		list: {
			visibility: C.VISIBILITY_PROTECTED
		},
		find: {
			visibility: C.VISIBILITY_PROTECTED
		},
		get: {
			visibility: C.VISIBILITY_PROTECTED
		},
		update: {
			visibility: C.VISIBILITY_PROTECTED
		},
		remove: {
			visibility: C.VISIBILITY_PROTECTED
		},

		/**
		 * Get user by JWT token (for API GW authentication)
		 *
		 * @actions
		 * @param {String} token - JWT token
		 *
		 * @returns {Object} Resolved user
		 */
		resolveToken: {
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

				const user = await this.getById(decoded.id);
				if (!user)
					throw new MoleculerClientError("User is not registered", 401, "USER_NOT_FOUND");

				if (!user.verified)
					throw new MoleculerClientError("Please activate your account!", 401, "ERR_ACCOUNT_NOT_VERIFIED");

				if (user.status !== 1)
					throw new MoleculerClientError("User is disabled", 401, "USER_DISABLED");

				return await this.transformDocuments(ctx, {}, user);
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
			cache: {
				keys: ["#userID"]
			},
			async handler(ctx) {
				if (!ctx.meta.userID) {
					return null;
					//throw new MoleculerClientError("There is no logged in user!", 400, "NO_LOGGED_IN_USER");
				}

				const user = await this.getById(ctx.meta.userID);
				if (!user) {
					return null;
					//throw new MoleculerClientError("User not found!", 400, "USER_NOT_FOUND");
				}

				// Check verified
				if (!user.verified) {
					return null;
					//throw new MoleculerClientError("Please activate your account!", 400, "ERR_ACCOUNT_NOT_VERIFIED");
				}

				// Check status
				if (user.status !== 1) {
					return null;
					//throw new MoleculerClientError("Account is disabled!", 400, "ERR_ACCOUNT_DISABLED");
				}

				return await this.transformDocuments(ctx, {}, user);
			}
		},

		/**
		 * Register a new user account
		 *
		 */
		register: {
			params: {
				username: { type: "string", min: 3, optional: true },
				password: { type: "string", min: 8, optional: true },
				email: { type: "email" },
				firstName: { type: "string", min: 2 },
				lastName: { type: "string", min: 2 },
				avatar: { type: "string", optional: true },
			},
			async handler(ctx) {
				if (!this.config["accounts.signup.enabled"])
					throw new MoleculerClientError("Sign up is not available.", 400, "ERR_SIGNUP_DISABLED");

				const params = Object.assign({}, ctx.params);
				const entity = {};

				// Verify email
				let found = await this.getUserByEmail(ctx, params.email);
				if (found)
					throw new MoleculerClientError("Email has already been registered.", 400, "ERR_EMAIL_EXISTS");

				// Verify username
				if (this.config["accounts.username.enabled"]) {
					if (!ctx.params.username) {
						throw new MoleculerClientError("Username can't be empty.", 400, "ERR_USERNAME_EMPTY");
					}

					let found = await this.getUserByUsername(ctx, params.username);
					if (found)
						throw new MoleculerClientError("Username has already been registered.", 400, "ERR_USERNAME_EXISTS");

					entity.username = params.username;
				}

				// Set basic data
				entity.email = params.email;
				entity.firstName = params.firstName;
				entity.lastName = params.lastName;
				entity.roles = this.config["accounts.defaultRoles"];
				entity.plan = this.config["accounts.defaultPlan"];
				entity.avatar = params.avatar;
				entity.socialLinks = {};
				entity.createdAt = Date.now();
				entity.verified = true;
				entity.status = 1;

				if (!entity.avatar) {
					// Default avatar as Gravatar
					const md5 = crypto.createHash("md5").update(entity.email).digest("hex");
					entity.avatar = `https://gravatar.com/avatar/${md5}?s=64&d=robohash`;
				}

				// Generate passwordless token or hash password
				if (params.password) {
					entity.passwordless = false;
					entity.password = await bcrypt.hash(params.password, 10);
				} else if (this.config["accounts.passwordless.enabled"]) {
					entity.passwordless = true;
					entity.password = this.generateToken();
				} else {
					throw new MoleculerClientError("Password can't be empty.", 400, "ERR_PASSWORD_EMPTY");
				}

				// Generate verification token
				if (this.config["accounts.verification.enabled"]) {
					entity.verified = false;
					entity.verificationToken = this.generateToken();
				}

				// Create new user
				const user = await this.adapter.insert(entity);

				// Send email
				if (user.verified) {
					// Send welcome email
					this.sendMail(ctx, user, "welcome");
					user.token = await this.getToken(user);
				} else {
					// Send verification email
					this.sendMail(ctx, user, "activate", { token: entity.verificationToken });
				}

				return this.transformDocuments(ctx, {}, user);
			}
		},

		/**
		 * Verify an account
		 */
		verify: {
			params: {
				token: { type: "string" }
			},
			async handler(ctx) {
				const user = await this.adapter.findOne({ verificationToken: ctx.params.token });
				if (!user)
					throw new MoleculerClientError("Invalid verification token!", 400, "INVALID_TOKEN");

				const res = await this.adapter.updateById(user._id, { $set: {
					verified: true,
					verificationToken: null
				}});

				// Send welcome email
				this.sendMail(ctx, res, "welcome");

				return {
					token: await this.getToken(res)
				};
			}
		},

		/**
		 * Disable an account
		 */
		disable: {
			params: {
				id: { type: "string" }
			},
			needEntity: true,
			async handler(ctx) {
				const user = ctx.entity;
				if (user.status == 0)
					throw new MoleculerClientError("Account has already been disabled!", 400, "ERR_USER_ALREADY_DISABLED");

				const res = await this.adapter.updateById(user._id, { $set: {
					status: 0
				}});

				return {
					status: res.status
				};
			}
		},

		/**
		 * Enable an account
		 */
		enable: {
			params: {
				id: { type: "string" }
			},
			needEntity: true,
			async handler(ctx) {
				const user = ctx.entity;
				if (user.status == 1)
					throw new MoleculerClientError("Account has already been enabled!", 400, "ERR_USER_ALREADY_ENABLED");

				const res = await this.adapter.updateById(user._id, { $set: {
					status: 1
				}});

				return {
					status: res.status
				};
			}
		},

		/**
		 * Check passwordless token
		 */
		passwordless: {
			params: {
				token: { type: "string" }
			},
			async handler(ctx) {
				if (!this.config["accounts.passwordless.enabled"])
					throw new MoleculerClientError("Passwordless login is not allowed.", 400, "ERR_PASSWORDLESS_DISABLED");

				const user = await this.adapter.findOne({ passwordlessToken: ctx.params.token });
				if (!user)
					throw new MoleculerClientError("Invalid token!", 400, "INVALID_TOKEN");

				// Check status
				if (user.status !== 1)
					throw new MoleculerClientError("Account is disabled!", 400, "ERR_ACCOUNT_DISABLED");

				// Check token expiration
				if (user.passwordlessTokenExpires < Date.now())
					throw new MoleculerClientError("Token expired!", 400, "TOKEN_EXPIRED");

				// Verified account if not
				if (!user.verified) {
					await this.adapter.updateById(user._id, { $set: {
						verified: true
					}});
				}

				return {
					token: await this.getToken(user)
				};
			}
		},

		/**
		 * Start "forgot password" process
		 */
		forgotPassword: {
			params: {
				email: { type: "email" }
			},
			async handler(ctx) {
				const token = this.generateToken();

				const user = await this.getUserByEmail(ctx, ctx.params.email);
				// Check email is exist
				if (!user)
					throw new MoleculerClientError("Email is not registered.", 400, "ERR_EMAIL_NOT_FOUND");

				// Check verified
				if (!user.verified)
					throw new MoleculerClientError("Please activate your account!", 400, "ERR_ACCOUNT_NOT_VERIFIED");

				// Check status
				if (user.status !== 1)
					throw new MoleculerClientError("Account is disabled!", 400, "ERR_ACCOUNT_DISABLED");

				// Save the token to user
				await this.adapter.updateById(user._id, { $set: {
					resetToken: token,
					resetTokenExpires: Date.now() + 3600 * 1000 // 1 hour
				}});

				// Send a passwordReset email
				this.sendMail(ctx, user, "reset-password", { token });

				return true;
			}
		},

		/**
		 * Reset password
		 */
		resetPassword: {
			params: {
				token: { type: "string" },
				password: { type: "string", min: 8 }
			},
			async handler(ctx) {
				// Check the token & expires
				const user = await this.adapter.findOne({ resetToken: ctx.params.token });
				if (!user)
					throw new MoleculerClientError("Invalid token!", 400, "INVALID_TOKEN");

				// Check status
				if (user.status !== 1)
					throw new MoleculerClientError("Account is disabled!", 400, "ERR_ACCOUNT_DISABLED");

				if (user.resetTokenExpires < Date.now())
					throw new MoleculerClientError("Token expired!", 400, "TOKEN_EXPIRED");

				// Change the password
				await this.adapter.updateById(user._id, { $set: {
					password: await bcrypt.hash(ctx.params.password, 10),
					passwordless: false,
					verified: true,
					resetToken: null,
					resetTokenExpires: null
				}});

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
			params: {
				id: { type: "string" },
				provider: { type: "string" },
				profile: { type: "object" },
			},
			async handler(ctx) {
				const res = await this.link(ctx.params.id, ctx.params.provider, ctx.params.profile);
				return this.transformDocuments(ctx, {}, res);
			}
		},

		/**
		 * Unlink account from a social account
		 */
		unlink: {
			params: {
				id: { type: "string", optional: true },
				provider: { type: "string" }
			},
			async handler(ctx) {
				const id = ctx.params.id ? ctx.params.id : ctx.meta.userID;
				if (!id)
					throw new MoleculerClientError("Missing user ID!", 400, "MISSING_USER_ID");

				const res = await this.unlink(id, ctx.params.provider);
				return this.transformDocuments(ctx, {}, res);
			}
		},

		/**
		 * Handle local login
		 */
		login: {
			params: {
				email: { type: "string", optional: false },
				password: { type: "string", optional: true },
				token: { type: "string", optional: true }
			},
			async handler(ctx) {
				let query;

				if (this.config["accounts.username.enabled"]) {
					query = {
						"$or": [
							{ email: ctx.params.email },
							{ username: ctx.params.email }
						]
					};
				} else {
					query = { email: ctx.params.email };
				}

				// Get user
				const user = await this.adapter.findOne(query);
				if (!user)
					throw new MoleculerClientError("User not found!", 400, "ERR_USER_NOT_FOUND");

				// Check verified
				if (!user.verified) {
					throw new MoleculerClientError("Please activate your account!", 400, "ERR_ACCOUNT_NOT_VERIFIED");
				}

				// Check status
				if (user.status !== 1) {
					throw new MoleculerClientError("Account is disabled!", 400, "ERR_ACCOUNT_DISABLED");
				}

				// Check passwordless login
				if (user.passwordless == true && ctx.params.password)
					throw new MoleculerClientError("This is a passwordless account! Please login without password.", 400, "ERR_PASSWORDLESS_WITH_PASSWORD");

				// Authenticate
				if (ctx.params.password) {
					// Login with password
					if (!(await bcrypt.compare(ctx.params.password, user.password)))
						throw new MoleculerClientError("Wrong password!", 400, "ERR_WRONG_PASSWORD");

				} else if (this.config["accounts.passwordless.enabled"]) {

					if (!this.config["mail.enabled"])
						throw new MoleculerClientError("Passwordless login is not available because mail transporter is not configured.", 400, "ERR_PASSWORDLESS_UNAVAILABLE");

					// Send magic link
					await this.sendMagicLink(ctx, user);

					return {
						passwordless: true,
						email: user.email
					};

				} else {
					throw new MoleculerClientError("Passwordless login is not allowed.", 400, "ERR_PASSWORDLESS_DISABLED");
				}

				// Check Two-factor authentication
				if (user.totp && user.totp.enabled) {
					if (!ctx.params.token)
						throw new MoleculerClientError("Two-factor authentication is enabled. Please give the 2FA code.", 400, "ERR_MISSING_2FA_CODE");

					if (!(await this.verify2FA(user.totp.secret, ctx.params.token)))
						throw new MoleculerClientError("Invalid 2FA token!", 400, "TWOFACTOR_INVALID_TOKEN");

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
				refreshToken: { type: "string", optional: true },
			},
			async handler(ctx) {
				const { provider, profile } = ctx.params;

				const query = { [`socialLinks.${provider}`]: profile.socialID };
				if (ctx.meta.user) {
					// There is logged in user. Link to the logged in user
					let user = await this.adapter.findOne(query);
					if (user) {
						if (user._id != ctx.meta.userID)
							throw new MoleculerClientError("This social account has been linked to another account.", 400, "ERR_SOCIAL_ACCOUNT_MISMATCH");

						// Same user
						user.token = await this.generateJWT({ id: user._id.toString() });
						return this.transformDocuments(ctx, {}, user);

					} else {
						// Not found linked account. Create the link
						user = await this.link(ctx.meta.userID, provider, profile);

						user.token = await this.generateJWT({ id: user._id.toString() });
						return this.transformDocuments(ctx, {}, user);
					}

				} else {
					// No logged in user
					if (!profile.email)
						throw new MoleculerClientError("Missing e-mail address in social profile", 400, "ERR_NO_SOCIAL_EMAIL");

					let foundBySocialID = false;

					let user = await this.adapter.findOne(query);
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
							throw new MoleculerClientError("Account is disabled!", 400, "ACCOUNT_DISABLED");
						}

						// Found the user by email.

						if (!foundBySocialID) {
							// Not found linked account. Create the link
							user = await this.link(user._id, provider, profile);
						}

						user.token = await this.generateJWT({ id: user._id.toString() });

						// TODO: Hack to handle wrong "entity._id.toHexString is not a function" error in mongo adapter
						user._id = this.decodeID(user._id);

						return this.transformDocuments(ctx, {}, user);
					}

					if (!this.config["accounts.signup.enabled"])
						throw new MoleculerClientError("Sign up is not available", 400, "ERR_SIGNUP_DISABLED");

					// Create a new user and link
					user = await ctx.call(`${this.fullName}.register`, {
						username: profile.username || profile.email.split("@")[0],
						password: await bcrypt.genSalt(),
						email: profile.email,
						firstName: profile.firstName,
						lastName: profile.lastName,
						avatar: profile.avatar
					});

					user = await this.link(user._id, provider, profile);

					user.token = await this.getToken(user);

					return this.transformDocuments(ctx, {}, user);
				}
			}
		},

		/**
		 * Enable Two-Factor authentication (2FA)
		 */
		enable2Fa: {
			params: {
				token: { type: "string", optional: true }
			},
			permissions: [C.ROLE_AUTHENTICATED],
			async handler(ctx) {
				const user = await this.adapter.findById(ctx.meta.userID);
				if (!user)
					throw new MoleculerClientError("User not found!", 400, "USER_NOT_FOUND");

				if (!ctx.params.token && (!user.totp || !user.totp.enabled)) {
					// Generate a TOTP secret and send back otpauthURL & secret
					const secret = speakeasy.generateSecret({ length: 10 });
					await this.adapter.updateById(ctx.meta.userID, { $set: {
						"totp.enabled": false,
						"totp.secret": secret.base32
					}});

					const otpauthURL = speakeasy.otpauthURL({
						secret: secret.ascii,
						label: ctx.meta.user.email,
						issuer: this.configObj.site.name
					});

					return {
						secret: secret.base32,
						otpauthURL
					};
				} else {
					// Verify the token with secret
					const secret = user.totp.secret;
					if (!(await this.verify2FA(secret, ctx.params.token)))
						throw new MoleculerClientError("Invalid token!", 400, "TWOFACTOR_INVALID_TOKEN");

					await this.adapter.updateById(ctx.meta.userID, { $set: {
						"totp.enabled": true,
					}});

					return true;
				}
			}
		},

		/**
		 * Disable Two-Factor authentication (2FA)
		 */
		disable2Fa: {
			params: {
				token: "string"
			},
			permissions: [C.ROLE_AUTHENTICATED],
			async handler(ctx) {
				const user = await this.adapter.findById(ctx.meta.userID);
				if (!user)
					throw new MoleculerClientError("User not found!", 400, "USER_NOT_FOUND");

				if (!user.totp || !user.totp.enabled)
					throw new MoleculerClientError("Two-factor authentication is not enabled!", 400, "TWOFACTOR_NOT_ENABLED");

				const secret = user.totp.secret;
				if (!(await this.verify2FA(secret, ctx.params.token)))
					throw new MoleculerClientError("Invalid token!", 400, "TWOFACTOR_INVALID_TOKEN");

				await this.adapter.updateById(ctx.meta.userID, { $set: {
					"totp.enabled": false,
					"totp.secret": null,
				}});

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
				const user = await this.adapter.findById(ctx.params.id);
				if (!user)
					throw new MoleculerClientError("User not found!", 400, "USER_NOT_FOUND");

				if (!user.totp || !user.totp.enabled)
					throw new MoleculerClientError("Two-factor authentication is not enabled!", 400, "TWOFACTOR_NOT_ENABLED");

				const secret = user.totp.secret;
				const token = this.generate2FaToken(secret);

				return { token };
			}
		}

	},

	/**
	 * Events
	 */
	events: {

	},

	/**
	 * Methods
	 */
	methods: {

		async getToken(user) {
			return await this.generateJWT({ id: user._id.toString() });
		},

		/**
		 * Generate a JWT token from user entity.
		 *
		 * @param {Object} payload
		 * @param {String|Number} expiresIn
		 */
		generateJWT(payload, expiresIn) {
			return new this.Promise((resolve, reject) => {
				return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: expiresIn || this.config["accounts.jwt.expiresIn"] }, (err, token) => {
					if (err) {
						this.logger.warn("JWT token generation error:", err);
						return reject(new MoleculerRetryableError("Unable to generate token", 500, "UNABLE_GENERATE_TOKEN"));
					}

					resolve(token);
				});
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
						return reject(new MoleculerClientError("Invalid token", 401, "INVALID_TOKEN"));
					}

					resolve(decoded);
				});
			});
		},

		async link(id, provider, profile) {
			return await this.adapter.updateById(id, { $set: {
				[`socialLinks.${provider}`]: profile.socialID,
				verified: true, // if not verified yet via email
				verificationToken: null
			}});
		},

		/**
		 * Unlink account from a social account
		 */
		async unlink(id, provider) {
			return await this.adapter.updateById(id, { $unset: {
				[`socialLinks.${provider}`]: 1
			}});
		},

		/**
		 * Send login magic link to user email
		 *
		 * @param {Context} ctx
		 * @param {Object} user
		 */
		async sendMagicLink(ctx, user) {
			const token = this.generateToken();

			const usr = await this.adapter.updateById(user._id, { $set: {
				passwordlessToken: token,
				passwordlessTokenExpires: Date.now() + 3600 * 1000 // 1 hour
			}});

			return await this.sendMail(ctx, usr, "magic-link", { token });
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
			if (!this.config["mail.enabled"])
				return this.Promise.resolve(false);

			try {
				return await ctx.call(this.settings.actions.sendMail, {
					to: user.email,
					template,
					data: _.defaultsDeep(data, {
						user,
						site: this.configObj.site
					})
				}, { retries: 3, timeout: 5000 });

			} catch(err) {
				/* istanbul ignore next */
				this.logger.error("Send mail error!", err);
				/* istanbul ignore next */
				throw err;
			}
		},

		/**
		 * Get user by email
		 *
		 * @param {Context} ctx
		 * @param {String} email
		 */
		async getUserByEmail(ctx, email) {
			return await this.adapter.findOne({ email });
		},

		/**
		 * Get user by username
		 *
		 * @param {Context} ctx
		 * @param {String} username
		 */
		async getUserByUsername(ctx, username) {
			return await this.adapter.findOne({ username });
		},

		/**
		 * Generate a token
		 *
		 * @param {Number} len Token length
		 */
		generateToken(len = 25) {
			return crypto.randomBytes(len).toString("hex");
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
		 * @returns {Boolean}
		 */
		async verify2FA(secret, token) {
			return speakeasy.totp.verify({
				secret,
				encoding: "base32",
				token
			});
		},

		/**
		 * Generate a TOTP token
		 *
		 * @param {String} secret
		 * @returns {String}
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
			const res = await this.adapter.insertMany([
				// Administrator
				{
					username: "admin",
					password: await this.hashPassword("admin"),
					firstName: "Administrator",
					lastName: "",
					email: "admin@kantab.io",
					avatar: "http://romaniarising.com/wp-content/uploads/2014/02/avatar-admin-robot-150x150.jpg",
					roles: ["administrator"],
					socialLinks: {},
					status: 1,
					plan: "full",
					verified: true,
					passwordless: false,
					createdAt: Date.now(),
				},

				// Test user
				{
					username: "test",
					password: await this.hashPassword("test"),
					firstName: "Test",
					lastName: "User",
					email: "test@kantab.io",
					avatar: "http://icons.iconarchive.com/icons/iconshock/real-vista-general/256/administrator-icon.png",
					roles: ["user"],
					socialLinks: {},
					status: 1,
					plan: "free",
					verified: true,
					passwordless: false,
					createdAt: Date.now(),
				}
			]);

			this.logger.info(`Generated ${res.length} users.`);
		},

	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {

	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {

	}
};
