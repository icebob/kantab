"use strict";

const _ 				= require("lodash");

const DbService 		= require("../mixins/db.mixin");
const CacheCleaner 		= require("../mixins/cache.cleaner.mixin");
const ConfigLoader 		= require("../mixins/config.mixin");
//const { MoleculerRetryableError, MoleculerClientError } = require("moleculer").Errors;

/**
 * Card attachment service
 */
module.exports = {
	name: "card-attachments",
	version: 1,

	mixins: [
		DbService("card-attachments"),
		CacheCleaner([
			"cache.clean.cards",
			"cache.clean.card-attachments",
			"cache.clean.accounts"
		]),
		ConfigLoader([
		])
	],

	/**
	 * Service dependencies
	 */
	dependencies: [
	],

	/**
	 * Service settings
	 */
	settings: {
		fields: [
			"_id",
			"board",
			"card",
			"createdBy",

			"type",
			"title",
			"description",
			"url",
			"size",

			"options",
			"createdAt",
			"updatedAt",
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
		remove: {},
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
