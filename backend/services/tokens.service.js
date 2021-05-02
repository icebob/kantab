"use strict";

const _ = require("lodash");
const crypto = require("crypto");
const C = require("../constants");
const DbService = require("../mixins/db.mixin");
//const ConfigLoader = require("../mixins/config.mixin");
//const { MoleculerRetryableError, MoleculerClientError } = require("moleculer").Errors;

const TOKEN_LENGTH = 50;

/**
 * Token service
 */
module.exports = {
	name: "tokens",
	version: 1,

	mixins: [
		DbService({ createActions: false })
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
				values: [
					C.TOKEN_TYPE_VERIFICATION,
					C.TOKEN_TYPE_PASSWORD_RESET,
					C.TOKEN_TYPE_API_KEY
				],
				required: true
			},
			token: { type: "string", length: TOKEN_LENGTH, required: true },
			expires: { type: "number", integer: true },
			owner: { type: "string", required: true } // TODO: validate via accounts.resolve
		}
	},

	indexes: [{ fields: ["type", "token"] }, { fields: "expires" }],

	/**
	 * Actions
	 */
	actions: {
		generate: {
			params: {
				type: {
					type: "enum",
					values: [
						C.TOKEN_TYPE_VERIFICATION,
						C.TOKEN_TYPE_PASSWORD_RESET,
						C.TOKEN_TYPE_API_KEY
					]
				},
				expires: { type: "number", integer: true, optional: true },
				owner: { type: "string" }
			},
			async handler(ctx) {
				const token = this.generateToken(TOKEN_LENGTH);
				return await this.createEntity(ctx, {
					...ctx.params,
					token
				});
			}
		},

		check: {
			params: {
				type: {
					type: "enum",
					values: [
						C.TOKEN_TYPE_VERIFICATION,
						C.TOKEN_TYPE_PASSWORD_RESET,
						C.TOKEN_TYPE_API_KEY
					]
				},
				token: { type: "string", length: TOKEN_LENGTH, required: true },
				owner: { type: "string" }
			},
			async handler(ctx) {
				const entity = await this.findEntity(ctx, {
					query: {
						type: ctx.params.type,
						token: ctx.params.token
					}
				});
				if (entity) {
					if (!ctx.params.owner || entity.owner == ctx.params.owner) {
						if (entity.expires && entity.expires < Date.now()) return false;
						return entity;
					}
				}
				return null;
			}
		},

		clearExpired: {
			handler(ctx) {
				// TODO
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
		 */
		generateToken(len = 50) {
			return crypto.randomBytes(len / 2).toString("hex");
		}
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {},

	/**
	 * Service started lifecycle event handler
	 */
	started() {},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {}
};
