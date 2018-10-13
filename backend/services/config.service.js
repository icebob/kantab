"use strict";

const _ 		= require("lodash");
const DbService = require("../mixins/db.mixin");
const { ValidationError } = require("moleculer").Errors;
const CacheCleaner 	= require("../mixins/cache.cleaner.mixin");
const { match } = require("moleculer").Utils;

/**
 * config service
 */
module.exports = {
	name: "config",
	version: 1,

	mixins: [
		DbService("configurations", { disableActions: true }),
		CacheCleaner([
			"cache.clean.config"
		])
	],

	/**
	 * Service settings
	 */
	settings: {
		defaultConfig: {
			"site.name": "KanBan",
			"site.url": process.env.NOW_URL || "http://localhost:4000",

			"mail.enabled": true,
			"mail.from": "no-reply@kantab.io",

			"accounts.signup.enabled": true,
			"accounts.username.enabled": true,
			"accounts.passwordless.enabled": true,
			"accounts.verification.enabled": true,
			"accounts.defaultRoles": ["user"],
			"accounts.defaultPlan": "free",
			"accounts.jwt.expiresIn": "30d"
		},

		// Fields in responses
		fields: [
			"key",
			"value",
			"isDefault",
			"createdAt",
			"updatedAt"
		],

		// Indexes on collection
		indexes: [
			{ key: 1 }
		]
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Get configurations by key or keys
		 *
		 * @actions
		 * @param {String|Array<String>} key
		 * @returns {Object|Array<String>}
		 */
		get: {
			cache: {
				keys: ["key"]
			},
			/*params: [
				{
					key: "string"
				},
				{
					key: { type: "array", items: "string" }
				},
			],*/
			async handler(ctx) {
				if (ctx.params.key == null)
					throw new ValidationError("Param 'key' must be defined.", "ERR_KEY_NOT_DEFINED");

				return await this.transformDocuments(ctx, {}, await this.get(ctx.params.key));
			}
		},

		/**
		 * Set configuration values by keys
		 *
		 * @actions
		 * @param {String} key
		 * @param {any} key
		 * @returns {Object|Array<Object>}
		 */
		set: {
			/*params: [
				{
					key: { type: "string" },
					value: { type: "any" }
				},
				{
					type: "array", items: {
						type: "object", props: {
							key: "string",
							value: "any"
						}
					}
				}
			],*/
			async handler(ctx) {
				if (Array.isArray(ctx.params)) {
					return this.Promise.all(ctx.params.map(async p => {
						const { changed, item } = await this.set(p.key, p.value);
						const res = await this.transformDocuments(ctx, {}, item);
						if (changed)
							this.broker.broadcast(`${this.name}.${item.key}.changed`, res);

						return res;
					}));
				} else {
					const { changed, item } = await this.set(ctx.params.key, ctx.params.value);
					const res = await this.transformDocuments(ctx, {}, item);
					if (changed)
						this.broker.broadcast(`${this.name}.${item.key}.changed`, res);

					return res;
				}
			}
		},

		all: {
			cache: true,
			handler() {
				return this.adapter.find({});
			}
		}
	},

	/**
	 * Methods
	 */
	methods: {

		/**
		 * Get configurations by key.
		 *
		 * @methods
		 * @param {String|Array<String>} key Config key
		 * @returns {Object|Array<Object>}
		 */
		async get(key) {
			if (Array.isArray(key)) {
				const res = await this.Promise.all(key.map(k => this.getByMask(k)));
				return _.uniqBy(_.flattenDeep(res), item => item.key);
			} else {
				if (key.indexOf("*") == -1 && key.indexOf("?") == -1)
					return await this.adapter.findOne({ key });

				return await this.getByMask(key);
			}
		},

		/**
		 * Get configurations by key mask.
		 *
		 * @methods
		 * @param {String} mask Key mask
		 * @returns {Array<Object>}
		 */
		async getByMask(mask) {
			const allItems = await this.broker.call(`${this.fullName}.all`);

			/* istanbul ignore next */
			if (!allItems)
				return [];

			return allItems.filter(item => match(item.key, mask));
		},

		/**
		 * Check whether a configuration key exists.
		 *
		 * @methods
		 * @param {String} key
		 * @returns {Boolean}
		 */
		async has(key) {
			const res = await this.adapter.findOne({ key });
			return res != null;
		},

		/**
		 * Set a configuration value.
		 *
		 * @methods
		 * @param {String} key Key
		 * @param {any} value Value
		 * @param {Boolean} isDefault
		 *
		 * @returns {Object}
		 */
		async set(key, value, isDefault = false) {
			const item = await this.adapter.findOne({ key });
			if (item != null) {
				if (!_.isEqual(item.value, value)) {
					// Modify
					return {
						item: await this.adapter.updateById(item._id, { $set: { value, isDefault, updatedAt: Date.now() } }),
						changed: true,
					};
				}

				// No changes
				return {
					item,
					changed: false,
				};
			}

			// Create new
			return {
				item: await this.adapter.insert({ key, value, isDefault, createdAt: Date.now() }),
				changed: true,
				new: true
			};
		},

		/**
		 * Run configuration migration. Add missing keys.
		 *
		 * @methods
		 * @private
		 */
		migrateConfig() {
			return this.Promise.all(Object.keys(this.settings.defaultConfig).map(async key => {
				const value = this.settings.defaultConfig[key];
				const item = await this.get(key);
				if (!item) {
					this.logger.info(`Save new config: "${key}" =`, value);
					return this.set(key, value, true);
				} else if (item.isDefault && !_.isEqual(item.value, value)) {
					this.logger.info(`Update default config: "${key}" =`, value);
					return this.set(key, value, true);
				}
			}));
		}
	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {
		return this.migrateConfig();
	},

};
