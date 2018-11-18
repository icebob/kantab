"use strict";

const _ 						= require("lodash");
const fs						= require("fs");

const ApiGateway				= require("moleculer-web");
const { MoleculerServerError } 	= require("moleculer").Errors;

const SwaggerUI					= require("swagger-ui-dist");
const pkg 						= require("../../package.json");

module.exports = function(mixinOptions) {

	mixinOptions = _.defaultsDeep(mixinOptions, {
		routeOptions: {
			path: "/openapi",
		},
		schema: null
	});

	let shouldUpdateSchema = true;
	let schema = null;

	return {
		events: {
			"$services.changed"() { this.invalidateOpenApiSchema(); },
		},

		methods: {
			/**
			 * Invalidate the generated OpenAPI schema
			 */
			invalidateOpenApiSchema() {
				shouldUpdateSchema = true;
			},

			/**
			 * Generate OpenAPI Schema
			 */
			generateOpenAPISchema() {
				try {
					//return makeExecutableSchema({ typeDefs, resolvers });

					const res = _.defaultsDeep(mixinOptions.schema, {
						openapi: "3.0.1",

						// https://swagger.io/specification/#infoObject
						info: {
							title: `${pkg.name} API Documentation`,
							version: pkg.version,
						},

						// https://swagger.io/specification/#serverObject
						servers: [
							{
								url: `${this.isHTTPS ? "https" : "http"}://localhost:${this.server.address().port}/api/v1`,
								description: "Development server"
							}
						],

						// https://swagger.io/specification/#componentsObject
						components: {
							schemas: {
								Board: {
									type: "object",
									properties: {
										id: { type: "string", example: "5bf18691fe972d2464a7ba14" },
										title: { type: "string", example: "Test board" },
										slug: { type: "string", example: "test_board" },
										description: { type: "string", example: "Test board description" },
									}
								}
							}
						},

						// https://swagger.io/specification/#pathsObject
						paths: {
							"/boards": {
								"get": {
									description: "List boards",
									tags: ["boards"],
									operationId: "v1.boards.get",
									responses: {
										"200": {
											description: "Board",
											content: {
												"application/json": {
													schema: {
														type: "array",
														items: {
															"$ref": "#/components/schemas/Board"
														}
													}
												}
											}
										}
									}
								},
								"post": {
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
										"200": {
											description: "Created board",
											content: {
												"application/json": {
													schema: {
														"$ref": "#/components/schemas/Board"
													}
												}
											}
										}
									}
								}
							}
						},

						// https://swagger.io/specification/#securityRequirementObject
						security: [],

						// https://swagger.io/specification/#tagObject
						tags: [
							{
								name: "boards",
								description: "Boards operations"
							}
						],

						// https://swagger.io/specification/#externalDocumentationObject
						externalDocs: []
					});

					return res;

				} catch(err) {
					throw new MoleculerServerError("Unable to compile OpenAPI schema", 500, "UNABLE_COMPILE_OPENAPI_SCHEMA", { err });
				}
			}
		},

		created() {
			const route = _.defaultsDeep(mixinOptions.routeOptions, {
				use: [
					ApiGateway.serveStatic(SwaggerUI.absolutePath())
				],

				aliases: {

					"GET /openapi.json"(req, res) {
						// Send back the generated schema
						if (shouldUpdateSchema || !schema) {
							// Create new server & regenerate GraphQL schema
							this.logger.info("♻ Regenerate OpenAPI/Swagger schema...");

							try {
								schema = this.generateOpenAPISchema();

								shouldUpdateSchema = false;

								this.logger.debug(schema);
								fs.writeFileSync("./openapi.json", JSON.stringify(schema, null, 4), "utf8");
							} catch(err) {
								this.logger.warn(err);
								this.sendError(req, res, err);
							}
						}

						const ctx = req.$ctx;
						ctx.meta.responseType = "application/json";

						return this.sendResponse(ctx, req.$route, req, res, schema);
					}
				},

				mappingPolicy: "restrict",
			});

			// Add route
			this.settings.routes.unshift(route);
		},

		started() {
			this.logger.info(`📜 OpenAPI Docs server is available at ${mixinOptions.routeOptions.path}`);
		}
	};
};
