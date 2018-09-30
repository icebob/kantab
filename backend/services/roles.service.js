"use strict";

const DbService 	= require("../mixins/db.mixin");
const CacheCleaner 	= require("../mixins/cache.cleaner.mixin");

/**
 * Roles service
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
		 * Seed an empty collection with an `admin` and a `user` roles.
		 */
		async seedDB() {
			const res = await this.adapter.insertMany([
				// Administrator
				{
					name: "admin",
					permissions: [
						"*"
					],
					status: 1,
					createdAt: Date.now(),
				},

				// User
				{
					name: "user",
					permissions: [
						"*"
					],
					status: 1,
					createdAt: Date.now(),
				}
			]);

			this.logger.info(`Generated ${res.length} roles!`);
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
