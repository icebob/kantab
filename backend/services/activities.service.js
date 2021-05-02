"use strict";

const _ = require("lodash");

const DbService = require("../mixins/db.mixin");
//const ConfigLoader = require("../mixins/config.mixin");
//const { MoleculerRetryableError, MoleculerClientError } = require("moleculer").Errors;

/**
 * Activities service (board, card, ...etc)
 */
module.exports = {
	name: "activities",
	version: 1,

	mixins: [
		DbService("activities")
		//CacheCleaner(["cache.clean.cards", "cache.clean.activities", "cache.clean.accounts"]),
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
			"card",

			"type", // Similar to https://developers.trello.com/reference#action-types
			"params",
			"text",

			"isSystem",
			"createdAt",
			"createdBy",
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
