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
			"_id",
			"owner",

			"title",
			"description",
			"position",
			"archived",
			"stars",
			"labels",
			"members",

			"options",
			"createdAt",
			"archivedAt",
			"deletedAt"
		],
		softDelete: true // TODO
	},

	/**
	 * Actions
	 */
	actions: {
		create: {
			permissions: ["boards.create"],
			async handler(ctx) {
				const entity = {
					title: ctx.params.title,
					description: ctx.params.description,
					owner: ctx.meta.userID
				};

				const doc = await this.adapter.insert(entity);
				const json = await this.transformDocuments(ctx, {}, doc);
				this.entityChanged("created", json, ctx);
				return json;
			}
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
