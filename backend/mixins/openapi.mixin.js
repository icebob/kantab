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
						},

						// https://swagger.io/specification/#pathsObject
						paths: {
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

					const services = this.broker.registry.getServiceList({ withActions: true });
					services.forEach(service => {

						// --- COMPILE SERVICE-LEVEL DEFINITIONS ---
						if (service.settings.openapi) {
							_.merge(res, service.settings.openapi);
						}

						// --- COMPILE ACTION-LEVEL DEFINITIONS ---
						_.forIn(service.actions, action => {
							if (action.openapi) {
								if (_.isObject(action.openapi)) {
									let def = _.cloneDeep(action.openapi);
									let method, routePath;
									if (def.$path) {
										const p = def.$path.split(" ");
										method = p[0].toLowerCase();
										routePath = p[1];
										delete def.$path;
									}

									_.set(res.paths, [routePath, method], def);
								}
							}
						});

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
