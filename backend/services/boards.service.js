"use strict";

const _ 				= require("lodash");

const DbService 		= require("../mixins/db.mixin");
const CacheCleaner 		= require("../mixins/cache.cleaner.mixin");
const ConfigLoader 		= require("../mixins/config.mixin");
const SecureID 			= require("../mixins/secure-id.mixin");
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
		SecureID(),
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
		fields: {
			id: { type: "string", readonly: true, primaryKey: true, secure: true, columnName: "_id" },
			owner: { required: true, populate: "v1.accounts.populate", set: (value, entity, ctx) => entity.owner || ctx.meta.user._id },
			title: { type: "string", required: true, trim: true },
			slug: { type: "string", readonly: true, set: (value, entity, ctx) => `${entity.title}-slug` },
			description: "string",
			position: { type: "number", hidden: true, default: 0 },
			archived: { type: "boolean", default: false },
			stars: { type: "number", default: 0 },
			labels: { type: "array" },
			members: { type: "array" },
			options: { type: "object" },
			createdAt: { type: "date", readonly: true, default: () => Date.now() },
			updatedAt: { type: "date", readonly: true, updateSet: () => Date.now() },
			archivedAt: { type: "date" },
			deletedAt: { type: "date" },
		},
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
				"administrator",
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
