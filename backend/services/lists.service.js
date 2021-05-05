"use strict";

const _ = require("lodash");

const DbService = require("../mixins/db.mixin");
//const ConfigLoader = require("../mixins/config.mixin");
//const { MoleculerRetryableError, MoleculerClientError } = require("moleculer").Errors;

/**
 * Lists service
 */
module.exports = {
	name: "lists",
	version: 1,

	mixins: [
		DbService("lists")
		//CacheCleaner(["cache.clean.lists", "cache.clean.boards", "cache.clean.accounts"]),
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
			"createdBy",

			"title",
			"description",
			"position",
			"archived",
			"stars",
			"labels",
			"members",

			"options",
			"createdAt",
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
