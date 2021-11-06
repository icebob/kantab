"use strict";

const _ = require("lodash");
const slugify = require("slugify");
const C = require("../constants");

const DbService = require("../mixins/db.mixin");
const ChecksMixin = require("../mixins/checks.mixin");
//const ConfigLoader = require("../mixins/config.mixin");
const { MoleculerClientError } = require("moleculer").Errors;
const { generateCRUDGraphQL } = require("../libs/graphql-generator");

/**
 * Boards service
 */
module.exports = {
	name: "boards",
	version: 1,

	mixins: [
		DbService(),
		ChecksMixin
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
				onCreate: ({ ctx }) => ctx.meta.userID,
				validate: "validateOwner",
				graphqlType: "User",
				graphqlInputType: "String"
			},
			title: { type: "string", required: true, trim: true, openapi: { example: "My board" } },
			slug: {
				type: "string",
				readonly: true,
				set: ({ value, params }) =>
					params.title
						? slugify(params.title, { lower: true, remove: /[*+~.()'"!:@]/g })
						: value
			},
			description: { type: "string", required: false, trim: true },
			position: { type: "number", integer: true, default: 0 },
			archived: { type: "boolean", readonly: true, default: false },
			public: { type: "boolean", default: false },
			//stars: { type: "number", integer: true, min: 0, default: 0 },
			//starred: { type: "boolean", virtual: true, get: (value, entity, field, ctx) => ctx.call("v1.stars.has", { type: "board", entity: entity.id, user: ctx.meta.userID })},
			labels: {
				type: "array",
				onCreate: () => _.cloneDeep(C.DEFAULT_LABELS),
				items: {
					type: "object",
					properties: {
						id: {
							type: "number",
							set({ value, root }) {
								if (value) return value;
								return this.generateNextLabelID(root.labels);
							}
						},
						name: { type: "string", required: true },
						color: { type: "string", required: true }
					}
				}
			},
			members: {
				type: "array",
				items: "string|no-empty",
				readonly: true,
				onCreate: ({ ctx }) => (ctx.meta.userID ? [ctx.meta.userID] : []),
				validate: "validateMembers",
				populate: {
					action: "v1.accounts.resolve",
					params: {
						fields: ["id", "username", "fullName", "avatar"]
					}
				},
				graphqlType: "User",
				graphqlInputType: "String"
			},
			options: { type: "object" },
			createdAt: {
				type: "number",
				readonly: true,
				onCreate: () => Date.now(),
				graphqlType: "Long"
			},
			updatedAt: {
				type: "number",
				readonly: true,
				onUpdate: () => Date.now(),
				graphqlType: "Long"
			},
			archivedAt: { type: "number", readonly: true, graphqlType: "Long" },
			deletedAt: {
				type: "number",
				readonly: true,
				onRemove: () => Date.now(),
				graphqlType: "Long"
			}
		},

		scopes: {
			// List only boards where the logged in user is a member.
			// If no logged in user, list only public boards.
			membership(query, ctx) {
				if (ctx && ctx.meta.userID) {
					query.members = ctx.meta.userID;
				} else {
					query.public = true;
				}
				return query;
			},

			// List the non-archived boards
			notArchived: { archived: false },

			// List the not deleted boards
			notDeleted: { deletedAt: null },

			// List public boards
			public: { public: true }
		},

		defaultScopes: ["membership", "notArchived", "notDeleted"],

		openapi: {
			// https://swagger.io/specification/#componentsObject
			components: {
				schemas: {
					Board: {
						required: ["id", "title"],
						type: "object",
						properties: {
							id: { type: "string" },
							title: { type: "string" },
							slug: { type: "string" },
							description: { type: "string" }
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
							total: { type: "integer" },
							page: { type: "integer" },
							pageSize: { type: "integer" },
							totalPages: { type: "integer" },
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
			permissions: [C.ROLE_AUTHENTICATED]
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
			permissions: [],
			cache: {
				keys: [
					"page",
					"pageSize",
					"fields",
					"sort",
					"search",
					"searchFields",
					"collation",
					"scope",
					"populate",
					"query",
					"#userID"
				]
			}
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
			permissions: []
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
			permissions: []
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
			permissions: [C.ROLE_MEMBER]
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
			permissions: [C.ROLE_MEMBER]
		},
		replace: false,
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
			permissions: [C.ROLE_OWNER]
		},

		// call v1.boards.addMembers --#userID xar8OJo4PMS753GeyN62 --id ZjQ1GMmYretJmgKpqZ14 --members[] xar8OJo4PMS753GeyN62
		addMembers: {
			rest: "POST /:id/add-members",
			params: {
				id: "string",
				members: "string[]"
			},
			needEntity: true,
			permissions: [C.ROLE_MEMBER],
			graphql: {
				mutation: `boardAddMembers(id: String!, members: [String!]!): Board!`
			},
			async handler(ctx) {
				const newMembers = _.uniq(
					[].concat(ctx.locals.entity.members || [], ctx.params.members)
				);

				return this.updateEntity(
					ctx,
					{
						...ctx.params,
						members: newMembers,
						scope: false
					},
					{ permissive: true }
				);
			}
		},

		removeMembers: {
			rest: "POST /:id/remove-members",
			params: {
				id: "string",
				members: "string[]"
			},
			needEntity: true,
			permissions: [C.ROLE_MEMBER],
			graphql: {
				mutation: `boardRemoveMembers(id: String!, members: [String!]!): Board!`
			},
			async handler(ctx) {
				const newMembers = ctx.locals.entity.members.filter(
					m => !ctx.params.members.includes(m)
				);

				return this.updateEntity(
					ctx,
					{
						id: ctx.params.id,
						members: newMembers,
						scope: false
					},
					{ permissive: true }
				);
			}
		},

		transferOwnership: {
			rest: "POST /:id/transfer-ownership",
			params: {
				id: "string",
				owner: "string"
			},
			needEntity: true,
			permissions: [C.ROLE_OWNER],
			graphql: {
				mutation: `boardTransferOwnership(id: String!, owner: String!): Board!`
			},
			async handler(ctx) {
				return this.updateEntity(
					ctx,
					{
						id: ctx.params.id,
						owner: ctx.params.owner,
						members: _.uniq([ctx.params.owner, ...ctx.locals.entity.members]),
						scope: false
					},
					{ permissive: true }
				);
			}
		},

		archive: {
			rest: "POST /:id/archive",
			params: {
				id: "string"
			},
			needEntity: true,
			permissions: [C.ROLE_OWNER],
			graphql: {
				mutation: `boardArchive(id: String!): Board!`
			},
			async handler(ctx) {
				if (ctx.locals.entity.archived)
					throw new MoleculerClientError(
						"Board is already archived",
						400,
						"BOARD_ALREADY_ARCHIVED",
						{ board: ctx.locals.entity.id }
					);
				return this.updateEntity(
					ctx,
					{
						id: ctx.params.id,
						archived: true,
						archivedAt: Date.now(),
						scope: false
					},
					{ permissive: true }
				);
			}
		},

		unarchive: {
			rest: "POST /:id/unarchive",
			params: {
				id: "string"
			},
			needEntity: true,
			defaultScopes: ["membership", "notDeleted"],
			permissions: [C.ROLE_OWNER],
			graphql: {
				mutation: `boardUnarchive(id: String!): Board!`
			},
			async handler(ctx) {
				if (!ctx.locals.entity.archived)
					throw new MoleculerClientError(
						"Board is not archived",
						400,
						"BOARD_NOT_ARCHIVED",
						{ board: ctx.locals.entity.id }
					);
				return this.updateEntity(
					ctx,
					{
						id: ctx.params.id,
						archived: false,
						archivedAt: null,
						scope: false
					},
					{ permissive: true }
				);
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
		 * Generate an incremental number for labels.
		 *
		 * @param {Array} labels
		 * @returns {Number}
		 */
		generateNextLabelID(labels) {
			if (!labels || labels.length == 0) return 1;

			const max = labels.reduce((m, lbl) => Math.max(m, lbl.id || 0), 0);
			return max + 1;
		},

		/**
		 * Validate the `members` property of board.
		 */
		validateMembers({ ctx, value, params, id, entity }) {
			const members = value;
			return ctx
				.call("v1.accounts.resolve", { id: members, throwIfNotExist: true })
				.then(res => {
					if (res.length == members.length) return res;
					throw new Error("One member is not a valid user.");
				})
				.then(async res => {
					if (id) {
						const owner = params.owner || entity.owner;
						if (!members.includes(owner)) {
							throw new MoleculerClientError(
								"The board owner can't be removed from the members.",
								400,
								"OWNER_CANT_BE_REMOVED",
								{ board: id, owner, members }
							);
						}
					}
					return res;
				})
				.then(() => true)
				.catch(err => err.message);
		},

		/**
		 * Validate the `owner` property of board.
		 */
		validateOwner({ ctx, value }) {
			return ctx
				.call("v1.accounts.resolve", { id: value, throwIfNotExist: true })
				.then(res =>
					res && res.status == C.STATUS_ACTIVE
						? true
						: `The owner '${value}' is not an active user.`
				)
				.catch(err => err.message);
		}
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {},

	merged(schema) {
		generateCRUDGraphQL("board", schema);
		console.log(schema.settings.graphql);
	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {}
};
