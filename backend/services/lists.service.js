"use strict";

const _ = require("lodash");

const C = require("../constants");
const DbService = require("../mixins/db.mixin");
const CacheCleaner = require("../mixins/cache-cleaner.mixin");
//const ConfigLoader = require("../mixins/config.mixin");
//const { MoleculerRetryableError, MoleculerClientError } = require("moleculer").Errors;

/**
 * List of boards service
 */
module.exports = {
	name: "lists",
	version: 1,

	mixins: [
		DbService(),
		CacheCleaner(["cache.clean.v1.lists", "cache.clean.v1.boards", "cache.clean.v1.accounts"])
		//ConfigLoader([])
	],

	/**
	 * Service dependencies
	 */
	dependencies: [{ name: "boards", version: 1 }],

	/**
	 * Service settings
	 */
	settings: {
		rest: "/v1/boards/:board/lists",

		fields: {
			id: {
				type: "string",
				primaryKey: true,
				secure: true,
				columnName: "_id"
			},
			board: {
				type: "string",
				required: true,
				immutable: true,
				populate: {
					action: "v1.boards.resolve",
					params: {
						fields: ["id", "title", "slug", "description"]
					}
				},
				validate: "validateBoard",
				graphql: { type: "Board", inputType: "String" }
			},
			title: { type: "string", required: true, trim: true, openapi: { example: "Backlog" } },
			description: {
				type: "string",
				required: false,
				trim: true,
				openapi: { example: "My list description" }
			},
			color: { type: "string", required: false, trim: true },
			position: { type: "number", integer: true, default: 0 },
			options: { type: "object" },
			createdAt: {
				type: "number",
				readonly: true,
				onCreate: () => Date.now(),
				graphql: { type: "Long" }
			},
			updatedAt: {
				type: "number",
				readonly: true,
				onUpdate: () => Date.now(),
				graphql: { type: "Long" }
			},
			deletedAt: {
				type: "number",
				readonly: true,
				hidden: "byDefault",
				onRemove: () => Date.now(),
				graphql: { type: "Long" }
			}
		},

		scopes: {
			// Return lists of a given board where the logged in user is a member.
			async board(query, ctx) {
				if (ctx && ctx.params.board) {
					const res = await this.validateBoard({ ctx, value: ctx.params.board });
					if (res === true) {
						query.board = ctx.params.board;
						return query;
					}
				}

				query.board = "<empty>";
				return query;
			},

			// List the not deleted boards
			notDeleted: { deletedAt: null }
		},

		defaultScopes: ["board", "notDeleted"]
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
	methods: {
		/**
		 * Validate the `board` property of list.
		 */
		validateBoard({ ctx, value }) {
			return ctx
				.call("v1.boards.resolve", { id: value, throwIfNotExist: true })
				.then(board => {
					return board.members.includes(ctx.meta.userID);
				})
				.catch(err => err.message);
		}
	},

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
