"use strict";

const _ = require("lodash");

const DbService = require("../mixins/db.mixin");
//const ConfigLoader = require("../mixins/config.mixin");
//const { MoleculerRetryableError, MoleculerClientError } = require("moleculer").Errors;

/**
 * Cards service
 */
module.exports = {
	name: "cards",
	version: 1,

	mixins: [
		DbService({
			cache: {
				additionalKeys: ["#userID"]
			}
		})
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
		/*fields: [
			"_id",
			"board",
			"list",
			"swimlane",
			"createdBy",

			"title",
			"description",
			"position",
			"archived",
			"labels",
			"members",
			"attachments",

			"options",
			"createdAt",
			"updatedAt",
			"archivedAt"
		]*/
	},

	/**
	 * Actions
	 */
	actions: {},

	/**
	 * Events
	 */
	events: {},

	/**
	 * Methods
	 */
	methods: {},

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
