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
		{ name: "accounts", version: 1 }
	],

	/**
	 * Service settings
	 */
	settings: {
		fields: [
			{ name: "_id", readonly: true, id: true },
			{ name: "owner", required: true, populate: "v1.accounts.populate", set: (value, entity, ctx) => entity.owner || ctx.meta.user._id },

			{ name: "title", type: "string", required: true, trim: true },
			{ name: "slug", type: "string", readonly: true, set: (value, entity, ctx) => `${entity.title}-slug` },
			{ name: "description", type: "string" },
			{ name: "position", type: "number", hidden: true, default: 0 },
			{ name: "archived", type: "boolean", default: false },
			{ name: "stars", type: "number", default: 0 },
			{ name: "labels", type: "array" },
			{ name: "members", type: "array" },

			{ name: "options", type: "object" },
			{ name: "createdAt", type: "date", readonly: true, default: () => Date.now() },
			{ name: "updatedAt", type: "date", readonly: true, updateSet: () => Date.now() },
			{ name: "archivedAt", type: "date" },
			{ name: "deletedAt", type: "date" },
		],
		strict: true, // TODO
		softDelete: true // TODO
	},

	/**
	 * Actions
	 */
	actions: {
		create: {
			permissions: ["boards.create"]
		},
		list: {
			permissions: ["boards.read"]
		},
		find: {
			permissions: ["boards.read"]
		},
		get: {
			needEntity: true,
			permissions: [
				"boards.read",
				"$owner"
			]
		},
		update: {
			needEntity: true,
			permissions: [
				"boards.",
				"$owner"
			]
		},
		remove: {
			needEntity: true,
			permissions: [
				"administrator",
				"$owner"
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
		/**
		 * Internal method to check the owner of entity. (called from CheckPermission middleware)
		 *
		 * @param {Context} ctx
		 * @returns {Boolean}
		 */
		async isEntityOwner(ctx) {
			return !!(ctx.entity && ctx.entity.owner == ctx.meta.userID);
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
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {

	}
};
