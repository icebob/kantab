"use strict";

const _ = require("lodash");
const slugify = require("slugify");
const C = require("../constants");

const DbService = require("../mixins/db.mixin");
//const ConfigLoader = require("../mixins/config.mixin");
const { MoleculerClientError } = require("moleculer").Errors;

/**
 * Boards service
 */
module.exports = {
	name: "boards",
	version: 1,

	mixins: [
		DbService()
		//ConfigLoader([])
	],

	/**
	 * Service dependencies
	 */
	dependencies: [{ name: "accounts", version: 1 }],

	/**
	 * Service settings
	 */
	settings: {
		rest: true,

		fields: {
			id: {
				type: "string",
				primaryKey: true,
				secure: true,
				columnName: "_id"
			},
			owner: {
				readonly: true,
				required: true,
				populate: {
					action: "v1.accounts.resolve",
					params: {
						fields: ["id", "username", "fullName", "avatar"]
					}
				},
				onCreate: (value, entity, field, ctx) => ctx.meta.userID,
				validate: (value, entity, field, ctx) =>
					ctx
						.call("v1.accounts.resolve", { id: value, throwIfNotExist: true })
						.then(res =>
							res && res.status == C.STATUS_ACTIVE
								? true
								: `The owner '${value}' is not an active user.`
						)
						.catch(err => err.message)
			},
			title: { type: "string", required: true, trim: true },
			slug: {
				type: "string",
				readonly: true,
				set: (value, entity) =>
					entity.title ? slugify(entity.title, { lower: true }) : value
			},
			description: { type: "string", required: false, trim: true },
			position: { type: "number", integer: true, default: 0 },
			archived: { type: "boolean", default: false },
			public: { type: "boolean", default: false },
			//stars: { type: "number", integer: true, min: 0, default: 0 },
			//starred: { type: "boolean", virtual: true, get: (value, entity, field, ctx) => ctx.call("v1.stars.has", { type: "board", entity: entity.id, user: ctx.meta.userID })},
			labels: { type: "array", items: "string|no-empty" },
			members: {
				type: "array",
				items: "string|no-empty",
				onCreate: (value, entity, field, ctx) => (ctx.meta.userID ? [ctx.meta.userID] : []),
				validate: (values, entity, field, ctx) =>
					ctx
						.call("v1.accounts.resolve", { id: values, throwIfNotExist: true })
						.then(res =>
							res.length == values.length ? true : "One member is not a valid user."
						)
						.catch(err => err.message),
				populate: {
					action: "v1.accounts.resolve",
					params: {
						fields: ["id", "username", "fullName", "avatar"]
					}
				}
			},
			options: { type: "object" },
			createdAt: { type: "number", readonly: true, onCreate: () => Date.now() },
			updatedAt: { type: "number", readonly: true, onUpdate: () => Date.now() },
			archivedAt: { type: "date", readonly: true },
			deletedAt: { type: "date", readonly: true, onDelete: () => Date.now() }
		},

		scopes: {
			membership(query, ctx) {
				if (ctx && ctx.meta.userID) {
					query.members = ctx.meta.userID;
				} else {
					query.public = true;
				}
				return query;
			}
		},

		defaultScopes: ["membership"],

		graphql: {
			type: `
				type Board {
					id: String!,
					owner: User!,
					title: String!,
					slug: String!,
					description: String,
					position: Int,
					archived: Boolean,
					public: Boolean,
					stars: Int,
					members: [User],
					# options: Object,
					createdAt: Float,
					updatedAt: Float,
					archivedAt: Float,
					deletedAt: Float
				}
			`,
			resolvers: {
				Board: {
					owner: {
						action: "v1.accounts.get",
						rootParams: {
							owner: "id"
						}
					}
				}
			}
		},

		openapi: {
			// https://swagger.io/specification/#componentsObject
			components: {
				schemas: {
					Board: {
						required: ["id", "title"],
						type: "object",
						properties: {
							id: { type: "string", example: "5bf18691fe972d2464a7ba14" },
							title: { type: "string", example: "Test board" },
							slug: { type: "string", example: "test_board" },
							description: { type: "string", example: "Test board description" }
						}
					},
					Boards: {
						type: "array",
						items: {
							$ref: "#/components/schemas/Board"
						}
					},
					BoardList: {
						type: "object",
						properties: {
							total: { type: "integer", example: 50 },
							page: { type: "integer", example: 1 },
							pageSize: { type: "integer", example: 10 },
							totalPages: { type: "integer", example: 5 },
							rows: {
								type: "array",
								items: {
									$ref: "#/components/schemas/Board"
								}
							}
						}
					}
				}
			},

			// https://swagger.io/specification/#tagObject
			tags: [
				{
					name: "boards",
					description: "Boards operations"
				}
			]
		}
	},

	/**
	 * Actions
	 */
	actions: {
		create: {
			openapi: {
				$path: "POST /board",
				// https://swagger.io/specification/#operationObject
				description: "Create a new board",
				tags: ["boards"],
				operationId: "v1.boards.create",
				requestBody: {
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									title: { type: "string" },
									description: { type: "string" }
								}
							},
							example: {
								title: "New board",
								description: "My new board"
							}
						}
					}
				},
				responses: {
					200: {
						description: "Created board",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/Board"
								}
							}
						}
					}
				}
			},
			permissions: ["boards.create"],
			graphql: {
				mutation: "createBoard(title: String!, description: String): Board"
			}
		},
		list: {
			openapi: {
				$path: "GET /boards",
				description: "List boards with pages",
				tags: ["boards"],
				operationId: "v1.boards.list",
				parameters: [
					{
						in: "query",
						name: "page",
						schema: {
							type: "integer"
						},
						example: 1,
						required: false,
						description: "Page number"
					},
					{
						in: "query",
						name: "pageSize",
						schema: {
							type: "integer"
						},
						example: 10,
						required: false,
						description: "Page size"
					},
					{
						in: "query",
						name: "sort",
						schema: {
							type: "string"
						},
						example: "title,-createdAt",
						required: false,
						description: "Sorting"
					},
					{
						in: "query",
						name: "fields",
						schema: {
							type: "string"
						},
						example: "title,description, owner",
						required: false,
						description: "Filtered fields"
					},
					{
						in: "query",
						name: "populate",
						schema: {
							type: "string"
						},
						example: "owner",
						required: false,
						description: "Populated fields"
					},
					{
						in: "query",
						name: "search",
						schema: {
							type: "string"
						},
						required: false,
						description: "Search text"
					},
					{
						in: "query",
						name: "searchFields",
						schema: {
							type: "string"
						},
						required: false,
						description: "Fields for searching"
					},
					{
						in: "query",
						name: "query",
						schema: {
							type: "object"
						},
						required: false,
						description: "Custom query"
					}
				],
				responses: {
					200: {
						description: "Boards",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/BoardList"
								}
							}
						}
					}
				}
			},
			permissions: ["boards.read"]
		},
		find: {
			rest: "GET /find",
			openapi: {
				$path: "GET /boards/find",
				description: "Find boards",
				tags: ["boards"],
				operationId: "v1.boards.find",
				responses: {
					200: {
						description: "Boards",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/Boards"
								}
							}
						}
					}
				}
			},
			permissions: ["boards.read"],
			graphql: {
				query: "boards(limit: Int, offset: Int, sort: String): [Board]"
			}
		},
		count: {
			rest: "GET /count",
			openapi: {
				$path: "GET /boards/count",
				description: "Number of boards",
				tags: ["boards"],
				operationId: "v1.boards.count",
				responses: {
					200: {
						description: "Number of boards",
						content: {
							"application/json": {
								schema: {
									type: "number"
								}
							}
						}
					}
				}
			},
			permissions: ["boards.read"],
			graphql: {
				query: "boardsCount: Int"
			}
		},
		get: {
			openapi: {
				$path: "GET /boards/{id}",
				// https://swagger.io/specification/#operationObject
				description: "Get a board by ID",
				tags: ["boards"],
				operationId: "v1.boards.get",
				parameters: [
					{
						in: "path",
						name: "id",
						schema: {
							type: "string"
						},
						example: "5bf18691fe972d2464a7ba14",
						required: true,
						description: "Board ID"
					}
				],
				responses: {
					200: {
						description: "Found board",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/Board"
								}
							}
						}
					}
				}
			},
			needEntity: true,
			permissions: ["boards.read", "$owner"],
			graphql: {
				query: "board(id: String!): Board"
			}
		},
		update: {
			openapi: {
				$path: "PUT /boards/{id}",
				// https://swagger.io/specification/#operationObject
				description: "Update a board by ID",
				tags: ["boards"],
				operationId: "v1.boards.update",
				parameters: [
					{
						in: "path",
						name: "id",
						schema: {
							type: "string"
						},
						example: "5bf18691fe972d2464a7ba14",
						required: true,
						description: "Board ID"
					}
				],
				requestBody: {
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									title: { type: "string" },
									description: { type: "string" }
								}
							},
							example: {
								title: "New board",
								description: "My new board"
							}
						}
					}
				},
				responses: {
					200: {
						description: "Found board",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/Board"
								}
							}
						}
					}
				}
			},
			needEntity: true,
			permissions: ["administrator", "$owner"]
		},
		remove: {
			openapi: {
				$path: "DELETE /boards/{id}",
				// https://swagger.io/specification/#operationObject
				description: "Delete a board by ID",
				tags: ["boards"],
				operationId: "v1.boards.remove",
				parameters: [
					{
						in: "path",
						name: "id",
						schema: {
							type: "string"
						},
						example: "5bf18691fe972d2464a7ba14",
						required: true,
						description: "Board ID"
					}
				],
				responses: {
					200: {
						description: "Found board",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/Board"
								}
							}
						}
					}
				}
			},
			needEntity: true,
			permissions: ["administrator", "$owner"]
		},

		// call v1.boards.addMembers --#userID xar8OJo4PMS753GeyN62 --id ZjQ1GMmYretJmgKpqZ14 --members[] xar8OJo4PMS753GeyN62
		addMembers: {
			rest: "POST /:id/add-members",
			params: {
				id: "string",
				members: "string[]"
			},
			needEntity: true,
			async handler(ctx) {
				const newMembers = _.uniq(
					[].concat(ctx.locals.entity.members || [], ctx.params.members)
				);

				return this.updateEntity(ctx, {
					...ctx.params,
					members: newMembers
				});
			}
		},

		removeMembers: {
			rest: "POST /:id/remove-members",
			params: {
				id: "string",
				members: "string[]"
			},
			needEntity: true,
			async handler(ctx) {
				const newMembers = ctx.locals.entity.members.filter(
					m => !ctx.params.members.includes(m)
				);

				if (!newMembers.includes(ctx.locals.entity.owner)) {
					throw new MoleculerClientError(
						"The board owner can't be removed from the members.",
						400,
						"OWNER_CANT_BE_REMOVED",
						{
							board: ctx.params.id,
							owner: ctx.locals.entity.owner,
							members: newMembers
						}
					);
				}

				return this.updateEntity(ctx, {
					id: ctx.params.id,
					members: newMembers
				});
			}
		},

		transferOwnership: {
			rest: "POST /:id/transfer-ownership",
			params: {
				id: "string",
				owner: "string"
			},
			needEntity: true,
			async handler(ctx) {
				return this.updateEntity(ctx, {
					id: ctx.params.id,
					owner: ctx.params.owner
				});
			}
		}
	},

	/**
	 * Events
	 */
	events: {},

	/**
	 * Methods
	 */
	methods: {
		/**
		 * Internal method to check the owner of entity. (called from CheckPermission middleware)
		 *
		 * @param {Context} ctx
		 * @returns {Promise<Boolean>}
		 */
		async isEntityOwner(ctx) {
			return !!(ctx.locals.entity && ctx.locals.entity.owner == ctx.meta.userID);
		},

		/**
		 * Internal method to check the membership of board.
		 *
		 * @param {Context} ctx
		 * @returns {Promise<Boolean>}
		 */
		async isBoardMember(ctx) {
			return !!(
				ctx.locals.entity &&
				ctx.meta.userID &&
				ctx.locals.entity.members.includes(ctx.meta.userID)
			);
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
