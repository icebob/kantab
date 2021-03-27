"use strict";

const _ = require("lodash");

const DbService = require("../mixins/db.mixin");
const CacheCleaner = require("../mixins/cache.cleaner.mixin");
const ConfigLoader = require("../mixins/config.mixin");
//const { MoleculerRetryableError, MoleculerClientError } = require("moleculer").Errors;

/**
 * Card activities service
 */
module.exports = {
	name: "card.activities",
	version: 1,

	mixins: [
		DbService("card-activities"),
		CacheCleaner(["cache.clean.cards", "cache.clean.card.activities", "cache.clean.accounts"]),
		ConfigLoader([])
	],

	/**
	 * Service dependencies
	 */
	dependencies: [],

	/**
	 * Service settings
	 */
	settings: {
		fields: [
			"_id",
			"board",
			"card",
			"createdBy",

			"type", // Similar to https://developers.trello.com/reference#action-types
			"params",
			"text",

			"isSystem",
			"createdAt",
			"updatedAt"
		]
	},

	/**
	 * Actions
	 */
	actions: {
		// Change visibility of default actions
		create: {},
		list: {},
		find: {},
		get: {},
		update: {},
		remove: {}
	},

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
