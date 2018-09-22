"use strict";

const crypto 		= require("crypto");
const bcrypt 		= require("bcrypt");
const _ 			= require("lodash");

const jwt 			= require("jsonwebtoken");

const DbService = require("../mixins/db.mixin");
const CacheCleaner 	= require("../mixins/cache.cleaner.mixin");
const ConfigLoader = require("../mixins/config.mixin");
const { MoleculerRetryableError, MoleculerClientError } = require("moleculer").Errors;

const HASH_SALT_ROUND = 10;
/**
 * account service
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
			"_id",
			"username",
			"firstName",
			"lastName",
			"email",
			"avatar",
			"roles",
			"socialLinks",
			"status",
			"plan",
			"verified",
			"passwordless",
			"createdAt",
			"updatedAt",
			"lastLoginAt"
		]
	},

	/**
	 * Actions
	 */
	actions: {
		// Change visibility of default actions
		create: {
			visibility: "protected"
		},
		list: {
			visibility: "protected"
		},
		find: {
			visibility: "protected"
		},
		get: {
			visibility: "protected"
		},
		update: {
			visibility: "protected"
		},
		remove: {
			visibility: "protected"
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
				keys: ["#user._id"]
			},
			async handler(ctx) {
				if (!ctx.meta.user) {
					return null;
					//throw new MoleculerClientError("There is no logged in user!", 400, "NO_LOGGED_IN_USER");
				}

				const user = await this.getById(ctx.meta.user._id);
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
				const user = await ctx.call(`${this.fullName}.create`, entity);

				// Send email
				if (user.verified) {
					// Send welcome email
					this.sendMail(ctx, user, "welcome");
					user.token = await this.getToken(user);
				} else {
					// Send verification email
					this.sendMail(ctx, user, "activate", { token: entity.verificationToken });
				}

				return user;
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

				const res = await ctx.call(`${this.fullName}.update`, {
					id: user._id,
					verified: true,
					verificationToken: null
				});

				// Send welcome email
				this.sendMail(ctx, res, "welcome");

				return {
					token: await this.getToken(res)
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

				if (user.passwordlessTokenExpires < Date.now())
					throw new MoleculerClientError("Token expired!", 400, "TOKEN_EXPIRED");

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
				if (!user.verified) {
					throw new MoleculerClientError("Please activate your account!", 400, "ERR_ACCOUNT_NOT_VERIFIED");
				}

				// Check status
				if (user.status !== 1) {
					throw new MoleculerClientError("Account is disabled!", 400, "ERR_ACCOUNT_DISABLED");
				}

				// Save the token to user
				await ctx.call(`${this.fullName}.update`, {
					id: user._id,
					resetToken: token,
					resetTokenExpires: Date.now() + 3600 * 1000 // 1 hour
				});

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

				if (user.resetTokenExpires < Date.now())
					throw new MoleculerClientError("Token expired!", 400, "TOKEN_EXPIRED");

				// Change the password
				await ctx.call(`${this.fullName}.update`, {
					id: user._id,
					password: await bcrypt.hash(ctx.params.password, 10),
					passwordless: false,
					resetToken: null,
					resetTokenExpires: null
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
			params: {
				user: { type: "object" },
				provider: { type: "string" },
				profile: { type: "object" },
			},
			async handler(ctx) {
				const user = await ctx.call(`${this.fullName}.update`, {
					id: this.adapter.stringToObjectID(ctx.params.user._id),
					[`socialLinks.${ctx.params.provider}`]: ctx.params.profile.socialID,
					verified: true, // if not verified yet via email
					verificationToken: null
				});

				return user;
			}
		},

		/**
		 * Unlink account from a social account
		 */
		unlink: {
			params: {
				user: { type: "object" },
				provider: { type: "string" }
			},
			async handler(ctx) {
				const user = ctx.call(`${this.fullName}.update`, {
					id: ctx.params.user._id,
					[`socialLinks.${ctx.params.provider}`]: null
				});

				return this.transformDocuments(ctx, {}, user);
			}
		},

		/**
		 * Handle local login
		 */
		login: {
			params: {
				email: { type: "string", optional: false },
				password: { type: "string", optional: true }
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
						if (user._id != ctx.meta.user._id)
							throw new MoleculerClientError("This social account has been linked to another account.", 400, "ERR_SOCIAL_ACCOUNT_MISMATCH");

						// Same user
						user.token = await this.generateJWT({ id: user._id.toString() });
						return user;

					} else {
						// Not found linked account. Create the link
						user = await ctx.call(`${this.fullName}.link`, { user: ctx.meta.user, provider, profile });

						user.token = await this.generateJWT({ id: user._id.toString() });
						return user;
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
							user = await ctx.call(`${this.fullName}.link`, { user, provider, profile });
						}

						user.token = await this.generateJWT({ id: user._id.toString() });
						return user;
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

					if (!foundBySocialID)
						user = await ctx.call(`${this.fullName}.link`, { user, provider, profile });

					user.token = await this.getToken(user);

					return user;
				}
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

		/**
		 * Send login magic link to user email
		 *
		 * @param {Context} ctx
		 * @param {Object} user
		 */
		async sendMagicLink(ctx, user) {
			const token = this.generateToken();

			const usr = await ctx.call(`${this.fullName}.update`, {
				id: user._id,
				passwordlessToken: token,
				passwordlessTokenExpires: Date.now() + 3600 * 1000 // 1 hour
			});

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
				this.logger.error("Send mail error!", err);
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
			const users = await ctx.call(`${this.fullName}.find`, { query: { email }});
			return users.length > 0 ? users[0] : null;
		},

		/**
		 * Get user by username
		 *
		 * @param {Context} ctx
		 * @param {String} username
		 */
		async getUserByUsername(ctx, username) {
			const users = await ctx.call(`${this.fullName}.find`, { query: { username }});
			return users.length > 0 ? users[0] : null;
		},

		/**
		 * Generate a token
		 *
		 * @param {Number} len Token length
		 */
		generateToken(len = 25) {
			return crypto.randomBytes(len).toString("hex");
		},

		async hashPassword(pass) {
			return bcrypt.hash(pass, HASH_SALT_ROUND);
		},

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
					roles: ["admin"],
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

			this.logger.info(`Generated ${res.length} users!`);
		},

		/*configChanged(key, value) {
			this.logger.warn(`'${key}' is changed to ${value}!`);
		}*/
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
