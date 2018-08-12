"use strict";

const crypto 		= require("crypto");
const bcrypt 		= require("bcrypt");
const _ 			= require("lodash");

const jwt 			= require("jsonwebtoken");

const DbService = require("../mixins/db.mixin");
const CacheCleaner 	= require("../mixins/cache.cleaner.mixin");
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
		])
	],

	/**
	 * Service settings
	 */
	settings: {
		// TODO: Move to `config` service
		enableSignUp: true,
		enablePasswordless: true,
		enableUsername: true,
		sendMail: true,
		verification: true,
		socialProviders: {},

		defaultRoles: ["user"],
		defaultPlan: "free",
		JWTTokenExpiresIn: "30d",

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
	 * Service metadata
	 */
	metadata: {

	},

	/**
	 * Service dependencies
	 */
	dependencies: [
		{ name: "users", version: 1 }
	],

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
		 * @returns {Object} Resolved payload
		 */
		verifyJWT: {
			cache: {
				keys: ["token"],
				ttl: 60 * 60 // 1 hour
			},
			params: {
				token: "string"
			},
			handler(ctx) {
				return this.verifyJWT(ctx.params.token);
			}
		},

		/**
		 * Register a new user account
		 */
		register: {
			params: {
				username: { type: "string", /*min: 3, */optional: true },
				password: { type: "string", /*min: 6, */optional: true },
				email: { type: "email" },
				firstName: { type: "string", min: 2 },
				lastName: { type: "string", min: 2 },
				avatar: { type: "string", optional: true },
			},
			async handler(ctx) {
				if (!this.settings.enableSignUp)
					throw new MoleculerClientError("Sign up is not available.", 400, "ERR_SIGNUP_DISABLED");

				const params = Object.assign({}, ctx.params);
				const entity = {};
				
				// TODO validate params by settings (username, password...)

				// Verify email
				let found = await this.getUserByEmail(ctx, params.email);
				if (found)
					throw new MoleculerClientError("Email has already been registered.", 400, "ERR_EMAIL_EXISTS");

				// Verify username
				if (this.settings.enableUsername) {
					let found = await this.getUserByUsername(ctx, params.username);
					if (found)
						throw new MoleculerClientError("Username has already been registered.", 400, "ERR_USERNAME_EXISTS");
				}
									
				// Set basic data
				if (this.settings.enableUsername)
					entity.username = params.username;
				entity.email = params.email;
				entity.firstName = params.firstName;	
				entity.lastName = params.lastName;	
				entity.roles = this.settings.defaultRoles;
				entity.plan = this.settings.defaultPlan;
				entity.avatar = params.avatar;
				entity.socialLinks = {};	
				entity.createdAt = Date.now();	
				entity.verified = true;
				entity.status = 1;

				// Generate passwordless token or hash password
				if (params.password) {
					entity.password = await bcrypt.hash(params.password, 10);
				} else if (this.settings.enablePasswordless) {
					entity.passwordless = true;
					entity.password = this.generateToken();
				} else {
					throw new MoleculerClientError("Passwordless login is not allowed.", 400, "ERR_PASSWORDLESS_DISABLED");
				}

				// Generate verification token
				if (this.settings.verification && !entity.passwordless) {
					entity.verified = false;
					entity.verificationToken = this.generateToken();
				}

				// Create new user
				const user = await ctx.call(`${this.fullName}.create`, entity);

				// Send email
				if (user.verified) {
					// Send welcome email
					this.sendMail(ctx, user, "welcome");
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
				let user = await this.adapter.findOne({ verificationToken: ctx.params.token });
				if (!user)
					throw new MoleculerClientError("Invalid verification token or expired!", 400, "INVALID_TOKEN");

				user = await this.adapter.updateById(user._id, {
					"$set": {
						verified: true,
						verificationToken: null
					}
				});
				
				// Send welcome email
				this.sendMail(ctx, user, "welcome");

				return user;					
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
				if (!this.settings.enablePasswordless)
					throw new MoleculerClientError("Passwordless login is not allowed.", 400, "ERR_PASSWORDLESS_DISABLED");

				const user = await this.adapter.findOne({ passwordlessToken: ctx.params.token });
				if (!user)
					throw new MoleculerClientError("Invalid token!", 400, "INVALID_TOKEN");

				if (user.passwordlessTokenExpires < Date.now())
					throw new MoleculerClientError("Token expired!", 400, "TOKEN_EXPIRED");

				return this.transformDocuments(ctx, {}, user);
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

				let user = await this.getUserByEmail(ctx, ctx.params.email);
				// Check email is exist
				if (!user)
					throw new MoleculerClientError("Email is not registered.", 400, "ERR_EMAIL_NOT_FOUND");

				// Save the token to user
				user = await ctx.call(`${this.fullName}.update`, {
					id: user._id,
					resetToken: token,
					resetTokenExpires: Date.now() + 3600 * 1000 // 1 hour
				});
				
				// Send a passwordReset email
				this.sendMail(ctx, user, "reset-password", { token });
			}
		},

		/**
		 * Check the reset password token
		 */
		checkResetToken: {
			params: {
				token: { type: "string" }
			},			
			async handler(ctx) {
				const user = await this.adapter.findOne({ resetToken: ctx.params.token });
				if (!user)
					throw new MoleculerClientError("Invalid token!", 400, "INVALID_TOKEN");

				if (user.resetTokenExpires < Date.now())
					throw new MoleculerClientError("Token expired!", 400, "TOKEN_EXPIRED");

				return this.transformDocuments(ctx, {}, user);
			}
		},

		/**
		 * Reset password
		 */
		resetPassword: {
			params: {
				token: { type: "string" },
				password: { type: "string", min: 6 }
			},			
			async handler(ctx) {
				// Check the token & expires
				let user = await ctx.call("users.checkResetPasswordToken", { token: ctx.params.token });
				
				// Change the password
				user = await ctx.call(`${this.fullName}.update`, {
					id: user._id,
					password: await bcrypt.hash(ctx.params.password, 10),
					passwordless: false,
					resetToken: null,
					resetTokenExpires: null
				});

				// Send password-changed email
				this.sendMail(ctx, user, "password-changed");

				return user;
			}
		},

		/**
		 * Link account to a social account
		 */
		link: {
			params: {
				user: { type: "object" },
				provider: { type: "string" },
				userData: { type: "object" },
			},
			async handler(ctx) {
				return ctx.call(`${this.fullName}.update`, {
					id: ctx.params.user._id,
					[`socialLinks.${ctx.params.provider}`]: ctx.params.userData.id,
					verified: true, // if not verified yet via email
					verificationToken: null
				});
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
				return ctx.call(`${this.fullName}.update`, {
					id: ctx.params.user._id,
					[`socialLinks.${ctx.params.provider}`]: null
				});
			}
		},

		/**
		 * Handle local login
		 */
		login: {
			params: {
				email: { type: "string", optional: true },
				password: { type: "string", optional: true }
			},
			async handler(ctx) {
				let query;

				if (this.settings.enableUsername) {
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
				const users = await ctx.call(`${this.fullName}.find`, { query });
				if (users.length == 0) 
					throw new MoleculerClientError("User is not exist!", 400, "ERR_USER_NOT_FOUND");

				const user = users[0];

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
					throw new MoleculerClientError("This is a passwordless account! Please login without password", 400, "ERR_PASSWORDLESS_WITH_PASSWORD");

				// Authenticate
				if (ctx.params.password) {
					// Login with password
					await ctx.call(`${this.fullName}.checkPassword`, { id: user._id, password: ctx.params.password });

				} else if (this.settings.enablePasswordless) {
					// Send magic link
					await this.sendMagicLink(ctx, user);

					// TODO: send back with ctx.meta
					throw new MoleculerClientError(`An email has been sent to ${user.email} with magic link. Please check your spam folder if it does not arrive.`, 400, "MAGIC_LINK_SENT");

				} else {
					throw new MoleculerClientError("Passwordless login is not allowed.", 400, "ERR_PASSWORDLESS_DISABLED");
				}

				return user;
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
				const provider = ctx.params.provider;
				const userData = this.getUserDataFromSocialProfile(provider, ctx.params.profile);

				if (userData) {
					const query = { [`socialLinks.${provider}`]: userData.id };

					if (ctx.meta.user) {
						// There is logged in user. Link to the logged in user
						const users = await ctx.call(`${this.fullName}.find`, { query });
						if (users.length > 0) {
							const user = users[0];
							if (user._id != ctx.meta.user._id) 
								throw new MoleculerClientError("This social account has been linked to an other account.", 400, "ERR_SOCIAL_ACCOUNT_MISMATCH");
						
							// Same user
							return user;

						} else {
							// Not found linked account. Create the link
							return ctx.call("account.link", { user: ctx.meta.user, provider, userData });
						}

					} else {
						// No logged in user
						if (!userData.email)
							throw new MoleculerClientError("Missing e-mail address in social profile", 400, "ERR_NO_SOCIAL_EMAIL");

						let foundBySocialID = false;
						
						let user;
						const users = await ctx.call(`${this.fullName}.find`, { query });
						if (users.length > 0) {
							// User found.
							foundBySocialID = true;
							user = users[0];
						} else {
							// Try to search user by email
							user = await this.getUserByEmail(ctx, userData.email);
						}

						if (user) {
							// Check status
							if (user.status !== 1) {
								throw new MoleculerClientError("Account is disabled!", 400, "ACCOUNT_DISABLED");
							}
							
							// Found the user by email.

							if (!foundBySocialID) {
								// Not found linked account. Create the link
								await ctx.call("account.link", { user, provider, userData });
							}
							
							return user;
						}

						if (!this.settings.enableSignUp)
							throw new MoleculerClientError("Sign up is not available", 400, "ERR_SIGNUP_DISABLED");

						// Create a new user and link 
						user = await ctx.call("account.register", {
							username: userData.username,
							password: bcrypt.genSaltSync(),
							email: userData.email,
							fullName: userData.name,
							avatar: userData.avatar
						});

						if (!foundBySocialID)
							return ctx.call("account.link", { user, provider, userData });
						
						return user;
					}

				} else
					throw new MoleculerClientError(`Unsupported provider: ${provider}`, 400, "ERR_UNSUPPORTED_PROVIDER");
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
		/**
		 * Generate a JWT token from user entity.
		 * 
		 * @param {Object} payload 
		 * @param {String|Number} expiresIn 
		 */
		generateJWT(payload, expiresIn) {
			return new this.Promise((resolve, reject) => {
				return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: expiresIn || this.settings.JWTTokenExpiresIn }, (err, token) => {
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
			if (!this.settings.sendMail)
				return this.Promise.resolve(false);

			try {
				return await ctx.call(this.settings.actions.sendMail, {
					to: user.email,
					template,
					data: _.defaultsDeep(data, { user })
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
					email: "admin@kantab.moleculer.services",
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
					email: "test@kantab.moleculer.services",
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
		}		
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