"use strict";

const C = require("../constants");
const DbService = require("../mixins/db.mixin");
const CacheCleaner = require("../mixins/cache-cleaner.mixin");
const MemberCheckMixin = require("../mixins/member-check.mixin");
const NextPositionMixin = require("../mixins/next-position.mixin");
const BoardValidatorsMixin = require("../mixins/board-validators.mixin");
//const ConfigLoader = require("../mixins/config.mixin");
const { MoleculerClientError } = require("moleculer").Errors;

/**
 * Card of boards service
 */
module.exports = {
	name: "cards",
	version: 1,

	mixins: [
		DbService({
			cache: {
				additionalKeys: ["list", "#userID"]
			}
		}),
		CacheCleaner([
			"cache.clean.v1.cards",
			"cache.clean.v1.lists",
			"cache.clean.v1.boards",
			"cache.clean.v1.accounts"
		]),
		MemberCheckMixin,
		NextPositionMixin,
		BoardValidatorsMixin
		//ConfigLoader([])
	],

	/**
	 * Service dependencies
	 */
	dependencies: [
		{ name: "boards", version: 1 },
		{ name: "lists", version: 1 }
	],

	/**
	 * Service settings
	 */
	settings: {
		rest: "/v1/boards/:board/lists/:list/cards",

		graphql: {
			entityName: "Card"
		},

		fields: {
			id: {
				type: "string",
				primaryKey: true,
				secure: true,
				columnName: "_id"
			},
			board: {
				type: "string",
				//required: true,
				immutable: true,
				populate: {
					action: "v1.boards.resolve",
					params: {
						fields: ["id", "title", "slug", "description"]
					}
				},
				validate: "validateBoard",
				default({ ctx }) {
					// Set the board from list.
					return ctx
						.call("v1.lists.resolve", { id: ctx.params.list })
						.then(list => list.board);
				},
				graphql: { type: "Board", inputType: "String" }
			},
			list: {
				type: "string",
				required: true,
				populate: {
					action: "v1.lists.resolve",
					params: {
						fields: ["id", "title"]
					}
				},
				validate: "validateList",
				graphql: { type: "List", inputType: "String" }
			},
			title: {
				type: "string",
				required: true,
				trim: true,
				empty: false,
				openapi: { example: "First card" }
			},
			description: {
				type: "string",
				required: false,
				trim: true,
				openapi: { example: "My card description" }
			},
			color: { type: "string", required: false, trim: true },
			position: {
				type: "number",
				graphql: { type: "Float" },
				default({ ctx }) {
					return this.getNextPosition(ctx);
				}
			},
			options: { type: "object" },
			labels: {
				type: "array",
				items: {
					type: "number"
				}
			},
			members: {
				type: "array",
				items: { type: "string", empty: false },
				validate: "validateMembers",
				populate: {
					action: "v1.accounts.resolve",
					params: {
						fields: ["id", "username", "fullName", "avatar"]
					}
				},
				graphql: { type: "[Member]", inputType: "String" }
			},
			// attachments,
			...C.ARCHIVED_FIELDS,
			...C.TIMESTAMP_FIELDS
		},

		scopes: {
			// Return lists of a given board list where the logged in user is a board member.
			async list(query, ctx, params) {
				// Adapter init
				if (!ctx) return query;

				if (params.list) {
					const res = await ctx.call("v1.lists.resolve", {
						id: params.list,
						throwIfNotExist: false
					});
					if (res) {
						if (ctx.action.rawName != "update") {
							// Support moving card between lists
							query.list = params.list;
						}
						return query;
					}
					throw new MoleculerClientError(
						`You have no right for the list '${params.list}'`,
						403,
						"ERR_NO_PERMISSION",
						{ list: params.list }
					);
				}
				if (ctx.action.params.list && !ctx.action.params.list.optional) {
					throw new MoleculerClientError(`List is required`, 422, "VALIDATION_ERROR", [
						{ type: "required", field: "list" }
					]);
				}
			},

			// List the non-archived cards
			notArchived: { archived: false },

			// List the not deleted cards
			notDeleted: { deletedAt: null }
		},

		defaultScopes: ["list", "notArchived", "notDeleted"]
	},

	/**
	 * Actions
	 */
	actions: {
		create: {
			permissions: [C.ROLE_BOARD_MEMBER]
		},
		list: {
			permissions: [],
			params: {
				list: { type: "string" }
			}
		},

		find: {
			rest: "GET /find",
			permissions: [],
			params: {
				list: { type: "string" }
			}
		},

		count: {
			rest: "GET /count",
			permissions: [],
			params: {
				list: { type: "string" }
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
			permissions: [C.ROLE_BOARD_MEMBER]
		}
	},

	/**
	 * Events
	 */
	events: {
		async "boards.removed"(ctx) {
			const board = ctx.params.data;
			try {
				const cards = await this.findEntities(ctx, {
					query: { board: board.id },
					fields: ["id"],
					scope: false
				});
				await this.Promise.all(
					cards.map(card => this.removeEntity(ctx, { id: card.id, scope: false }))
				);
			} catch (err) {
				this.logger.error(`Unable to delete cards of board '${board.id}'`, err);
			}
		},

		async "boards.cleared"(ctx) {
			try {
				await this.clearEntities(ctx);
			} catch (err) {
				this.logger.error("Unable to clear cards", err);
			}
		}
	},

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
