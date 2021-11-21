"use strict";

const _ = require("lodash");
const fs = require("fs");

const C = require("../constants");
const DbService = require("../mixins/db.mixin");
const CacheCleaner = require("../mixins/cache-cleaner.mixin");
const ChecksMixin = require("../mixins/checks.mixin");
//const ConfigLoader = require("../mixins/config.mixin");
const { MoleculerClientError } = require("moleculer").Errors;

/**
 * List of boards service
 */
module.exports = {
	name: "lists",
	version: 1,

	mixins: [
		DbService({
			cache: {
				additionalKeys: ["board", "#userID"]
			}
		}),
		CacheCleaner(["cache.clean.v1.lists", "cache.clean.v1.boards", "cache.clean.v1.accounts"]),
		ChecksMixin
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
			...C.TIMESTAMP_FIELDS
		},

		scopes: {
			// Return lists of a given board where the logged in user is a member.
			async board(query, ctx, params) {
				// Adapter init
				if (!ctx) return query;

				if (params.board) {
					const res = await ctx.call("v1.boards.resolve", {
						id: params.board,
						throwIfNotExist: false
					});
					if (res) {
						query.board = params.board;
						return query;
					}
					throw new MoleculerClientError(
						`You have no right for the board '${params.board}'`,
						403,
						"ERR_NO_PERMISSION",
						{ board: params.board }
					);
				}
				if (ctx.action.params.board) {
					throw new MoleculerClientError(`Board is required`, 422, "VALIDATION_ERROR", [
						{ type: "required", field: "board" }
					]);
				}
			},

			// List the not deleted boards
			notDeleted: { deletedAt: null }
		},

		defaultScopes: ["board", "notDeleted"]
	},

	/**
	 * Actions
	 */
	actions: {
		create: {
			permissions: [C.ROLE_AUTHENTICATED]
		},
		list: {
			permissions: [],
			params: {
				board: { type: "string" }
			}
		},

		find: {
			rest: "GET /find",
			permissions: [],
			params: {
				board: { type: "string" }
			}
		},

		count: {
			rest: "GET /count",
			permissions: [],
			params: {
				board: { type: "string" }
			}
		},

		get: {
			needEntity: true,
			permissions: [C.ROLE_BOARD_MEMBER]
		},

		update: {
			needEntity: true,
			permissions: [C.ROLE_BOARD_MEMBER]
		},

		replace: false,

		remove: {
			needEntity: true,
			permissions: [C.ROLE_BOARD_OWNER]
		}
	},

	/**
	 * Events
	 */
	events: {
		async "boards.removed"(ctx) {
			const board = ctx.params.data;
			try {
				const lists = await this.findEntities(ctx, {
					query: { board: board.id },
					fields: ["id"],
					scope: false
				});
				await this.Promise.all(lists.map(list => this.removeEntity(ctx, list)));
			} catch (err) {
				this.logger.error(`Unable to delete lists of board '${board.id}'`, err);
			}
		},

		async "boards.cleared"(ctx) {
			try {
				await this.clearEntities(ctx);
			} catch (err) {
				this.logger.error("Unable to clear lists", err);
			}
		}
	},

	/**
	 * Methods
	 */
	methods: {
		/**
		 * Validate the `board` property of list.
		 */
		validateBoard({ ctx, value }) {
			return ctx
				.call("v1.boards.resolve", { id: value, throwIfNotExist: true, fields: ["id"] })
				.then(() => true)
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
	started() {
		fs.writeFileSync("./service-schema.json", JSON.stringify(this.schema, null, 4), "utf8");
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {}
};
