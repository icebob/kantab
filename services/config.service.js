"use strict";

const _ 		= require("lodash");
const DbService = require("../mixins/db.mixin");
const CacheCleaner 	= require("../mixins/cache.cleaner.mixin");

/**
 * config service
 */
module.exports = {
	name: "config",
	version: 1,

	mixins: [
		DbService("configurations"),
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
		create: false,
		list: false,
		find: false,
		get: false,
		update: false,
		remove: false,		
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

		async has(key) {
			const res = await this.adapter.findOne({ key });
			return res != null;
		},

		async set(key, value) {
			const res = await this.adapter.findOne({ key });
			if (res != null)
				return await this.adapter.update({ key }, { $set: {	value } });
			else
				return await this.adapter.insert({ key, value });
		},	

		migrateConfig() {
			return this.Promise.all(Object.keys(this.settings.defaultConfig).map(async key => {
				const value = this.settings.defaultConfig[key];
				const has = await this.has(key);
				if (!has) {
					this.logger.info(`Save new config: "${key}" =`, value);
					return this.adapter.insert({ key, value });
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