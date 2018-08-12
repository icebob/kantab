"use strict";

const DbService 	= require("../mixins/db.mixin");
const CacheCleaner 	= require("../mixins/cache.cleaner.mixin");

/**
 * roles service
 * 
 */
module.exports = {
	name: "roles",
	version: 1,

	mixins: [
		DbService("roles"),
		CacheCleaner([
			"cache.clean.roles"
		])
	],

	/**
	 * Service settings
	 */
	settings: {
		fields: [
			"_id",
			"name",
			"permissions",
			"inherits",
			"status",
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
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {

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