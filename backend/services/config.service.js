"use strict";

const _ 		= require("lodash");
const DbService = require("../mixins/db.mixin");
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
			"site.url": "http://localhost:4000",

			"mail.enabled": true,
			"mail.from": "no-reply@kantab.moleculer.services",

			"accounts.signup.enabled": true,
			"accounts.username.enabled": true,
			"accounts.passwordless.enabled": true,
			"accounts.verification.enabled": true,
			"accounts.defaultRoles": ["user"],
			"accounts.defaultPlan": "free",
		},

		fields: [
			"key",
			"value",
			"isDefault",
			"createdAt",
			"updatedAt"
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
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {
		get: {
			params: {
				key: "string"
			},
			async handler(ctx) {
				return await this.transformDocuments(ctx, {}, await this.get(ctx.params.key));
			}
		},

		mget: {
			params: {
				keys: { type: "array", items: "string" }
			},
			async handler(ctx) {
				return await this.transformDocuments(ctx, {}, await this.get(ctx.params.keys));
			}
		},

		set: {
			params: {
				key: { type: "string" },
				value: { type: "any" }
			},
			async handler(ctx) {
				return await this.transformDocuments(ctx, {}, await this.set(ctx.params.key, ctx.params.value));
			}
		},

		mset: {
			params: { type: "array", items: {
				type: "object", props: {
					key: "string",
					value: "any"
				}
			}},
			async handler(ctx) {
				return await this.transformDocuments(ctx, {}, await this.Promise.all(ctx.params.map(item => this.set(item.key, item.value))));
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

		async getByMask(mask) {
			const allItems = await this.adapter.find({});
			if (!allItems)
				return [];

			return allItems.filter(item => match(item.key, mask));
		},

		async has(key) {
			const res = await this.adapter.findOne({ key });
			return res != null;
		},

		async set(key, value, isDefault = false, broadcast = true) {
			const item = await this.adapter.findOne({ key });
			if (item != null) {
				if (!_.isEqual(item.value, value)) {
					const res = await this.adapter.updateById(item._id, { $set: { value, isDefault, updatedAt: Date.now() } });
					if (broadcast)
						this.broker.broadcast(`${this.name}.${key}.changed`, res);
					return res;
				}
				return item;
			} else {
				const res = await this.adapter.insert({ key, value, isDefault, createdAt: Date.now() });
				if (broadcast)
					this.broker.broadcast(`${this.name}.${key}.changed`, res);
				return res;
			}
		},

		migrateConfig() {
			return this.Promise.all(Object.keys(this.settings.defaultConfig).map(async key => {
				const value = this.settings.defaultConfig[key];
				const item = await this.get(key);
				if (!item) {
					this.logger.info(`Save new config: "${key}" =`, value);
					return this.set(key, value, true, false);
				} else if (item.isDefault && !_.isEqual(item.value, value)) {
					this.logger.info(`Update default config: "${key}" =`, value);
					return this.set(key, value, true, false);
				}
			}));
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
		this.adapter.collection.createIndex({ key: 1 });

		return this.migrateConfig();
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {

	}
};
