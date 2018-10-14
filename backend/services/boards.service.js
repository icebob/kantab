"use strict";

const _ 				= require("lodash");

const DbService 		= require("../mixins/db.mixin");
const CacheCleaner 		= require("../mixins/cache.cleaner.mixin");
const ConfigLoader 		= require("../mixins/config.mixin");
//const { MoleculerRetryableError, MoleculerClientError } = require("moleculer").Errors;

/**
 * Boards service
 */
module.exports = {
	name: "boards",
	version: 1,

	mixins: [
		DbService("boards"),
		CacheCleaner([
			"cache.clean.boards",
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
		]
	},

	/**
	 * Actions
	 */
	actions: {
		// Change visibility of default actions
		create: {
			permissions: ["boards:create"]
		},
		list: {
			permissions: ["boards:read"]
		},
		find: {
			permissions: ["boards:read"]
		},
		get: {
			permissions: ["boards:read"]
		},
		update: {
			needEntity: true,
			permissions: [
				"administrator",
				function(ctx) {
					return ctx.meta.user && ctx.entity && ctx.entity.owner == ctx.meta.userID;
				}
			]
		},
		remove: {
			needEntity: true,
			permissions: [
				"administrator",
				function(ctx) {
					return ctx.meta.user && ctx.entity && ctx.entity.owner == ctx.meta.userID;
				}
			]
		},
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
