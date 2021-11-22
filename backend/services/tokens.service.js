"use strict";

const _ = require("lodash");
const crypto = require("crypto");
const C = require("../constants");
const DbService = require("../mixins/db.mixin");
const Cron = require("../mixins/cron.mixin");
//const ConfigLoader = require("../mixins/config.mixin");
//const { MoleculerRetryableError, MoleculerClientError } = require("moleculer").Errors;

const TOKEN_LENGTH = 50;

const TESTING = process.env.NODE_ENV === "test";

/**
 * Token service
 */
module.exports = {
	name: "tokens",
	version: 1,

	mixins: [
		DbService({ createActions: false }),
		Cron
		/*CacheCleaner([
			"cache.clean.boards",
			"cache.clean.lists",
			"cache.clean.cards",
			"cache.clean.accounts"
		]),*/
		//ConfigLoader([])
	],

	/**
	 * Service dependencies
	 */
	dependencies: [],

	/**
	 * Service settings
	 */
	settings: {
		fields: {
			id: {
				type: "string",
				primaryKey: true,
				secure: true,
				columnName: "_id"
			},
			type: {
				type: "enum",
				values: C.TOKEN_TYPES,
				required: true
			},
			name: { type: "string", max: 255 }, // for user API keys
			token: { type: "string", required: true },
			expiry: { type: "number", integer: true },
			owner: { type: "string", required: true }, // TODO: validate via accounts.resolve
			createdAt: { type: "number", readonly: true, onCreate: () => Date.now() },
			lastUsedAt: { type: "number", readonly: true, hidden: "byDefault" } // for API keys
		},

		indexes: [
			{ fields: "token", unique: true },
			{ fields: ["type", "token"] },
			{ fields: ["type", "owner"] },
			{ fields: "expiry" }
		]
	},

	crons: [
		{
			name: "ClearExpiredTokens",
			cronTime: "0 0 * * * *",
			onTick: {
				action: "v1.tokens.clearExpired"
			}
		}
	],

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Generate a new token.
		 */
		generate: {
			params: {
				type: {
					type: "enum",
					values: C.TOKEN_TYPES
				},
				expiry: { type: "number", integer: true, optional: true },
				owner: { type: "string" }
			},
			async handler(ctx) {
				const { token, secureToken } = this.generateToken(TOKEN_LENGTH);
				const res = await this.createEntity(ctx, {
					...ctx.params,
					token: secureToken
				});

				return { ...res, token };
			}
		},

		/**
		 * Check a token exist & not expired.
		 */
		check: {
			params: {
				type: {
					type: "enum",
					values: C.TOKEN_TYPES
				},
				token: { type: "string" },
				owner: { type: "string", optional: true },
				isUsed: { type: "boolean", default: false }
			},
			async handler(ctx) {
				let entity = await this.findEntity(ctx, {
					query: {
						type: ctx.params.type,
						token: this.secureToken(ctx.params.token)
					}
				});
				if (entity) {
					if (!ctx.params.owner || entity.owner == ctx.params.owner) {
						if (entity.expiry && entity.expiry < Date.now()) return false;

						if (ctx.params.isUsed) {
							entity = await this.updateEntity(
								ctx,
								{ id: entity.id, lastUsedAt: Date.now() },
								{ permissive: true }
							);
						}
						return entity;
					}
				}
				return null;
			}
		},

		/**
		 * Remove an invalidated token
		 */
		remove: {
			params: {
				type: {
					type: "enum",
					values: C.TOKEN_TYPES
				},
				token: { type: "string" }
			},
			async handler(ctx) {
				const entity = await this.findEntity(ctx, {
					query: {
						type: ctx.params.type,
						token: this.secureToken(ctx.params.token)
					}
				});
				if (entity) {
					await this.removeEntity(ctx, entity);
				}
				return null;
			}
		},

		/**
		 * Clear expired tokens.
		 */
		clearExpired: {
			visibility: "protected",
			async handler(ctx) {
				const adapter = await this.getAdapter(ctx);
				const count = await adapter.removeMany({ expiry: { $lt: Date.now() } });
				this.logger.info(`Removed ${count} expired token(s).`);
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
		 * Generate a token
		 *
		 * @param {Number} len Token length
		 * @returns {Object}
		 */
		generateToken(len = 50) {
			const token = crypto.randomBytes(len / 2).toString("hex");
			return { token, secureToken: this.secureToken(token) };
		},

		/**
		 * Secure a token with HMAC.
		 * @param {String} token
		 * @returns {String}
		 */
		secureToken(token) {
			const hmac = crypto.createHmac("sha256", process.env.TOKEN_SALT || "K4nTa3");
			hmac.update(token);
			return hmac.digest("hex");
		}
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		if (!process.env.TOKEN_SALT) {
			if (TESTING || process.env.TEST_E2E) {
				process.env.TOKEN_SALT = crypto.randomBytes(32).toString("hex");
			} else {
				this.broker.fatal("Environment variable 'TOKEN_SALT' must be configured!");
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
