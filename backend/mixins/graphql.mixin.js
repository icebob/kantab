"use strict";

const _ 						= require("lodash");

const { MoleculerServerError } 	= require("moleculer").Errors;
const { ApolloServer } 			= require("./apollo-server-moleculer");
const { makeExecutableSchema, mergeSchemas }	= require("graphql-tools");
const { printSchema } 			= require("graphql");

module.exports = function(mixinOptions) {

	mixinOptions = _.defaultsDeep(mixinOptions, {
		routePath: "/graphql",
		schema: null
	});

	let shouldUpdateSchema = true;

	return {
		events: {
			"$services.changed"() { this.invalidateGraphQLSchema(); },
			//"$node.connected"() { this.invalidateGraphQLSchema(); },
			//"$node.disconnected"() { this.invalidateGraphQLSchema(); },
		},

		methods: {
			/**
			 *
			 */
			invalidateGraphQLSchema() {
				shouldUpdateSchema = true;
			},

			/**
			 *
			 * @param {String} service
			 * @param {String} action
			 */
			getResolverActionName(service, action) {
				if (action.indexOf(".") === -1)
					return `${service}.${action}`;
				else
					return action;
			},

			/**
			 *
			 * @param {*} serviceName
			 * @param {*} resolvers
			 */
			createActionResolvers(serviceName, resolvers) {
				const res = {};
				_.forIn(resolvers, (r, name) => {
					if (_.isString(r)) {
						res[name] = this.createActionResolver(this.getResolverActionName(serviceName, r));
					}
					else if (_.isObject(r)) {
						res[name] = this.createActionResolver(this.getResolverActionName(serviceName, r.action), r);
					}
				});

				return res;
			},

			/**
			 *
			 * @param {String} actionName
			 * @param {Object?} def
			 */
			createActionResolver(actionName, def) {
				let params, rootKeys;
				if (def) {
					params = def.params;
					if (def.rootParams)
						rootKeys = Object.keys(def.rootParams);
				}
				return async (root, args, context) => {
					const p = {};
					if (root && rootKeys) {
						rootKeys.forEach(k => _.set(p, def.rootParams[k], _.get(root, k)));
					}
					return await context.ctx.call(actionName, _.defaultsDeep(args, p, params));
				};
			},

			/**
			 *
			 */
			generateGraphQLSchema() {
				try {
					let typeDefs = [];
					let resolvers = {
					};

					if (mixinOptions.typeDefs)
						typeDefs.push(mixinOptions.typeDefs);

					if (mixinOptions.resolvers)
						resolvers = _.cloneDeep(mixinOptions.resolvers);

					const queries = [];
					const types = [];
					const mutations = [];

					const services = this.broker.registry.getServiceList({ withActions: true });
					services.forEach(service => {
						if (service.settings.graphql) {
							const serviceName = service.version ? `v${service.version}.${service.name}` : service.name;

							// --- COMPILE SERVICE-LEVEL DEFINITIONS ---
							if (_.isObject(service.settings.graphql)) {
								const globalDef = service.settings.graphql;

								if (globalDef.query) {
									queries.push(globalDef.query);
								}

								if (globalDef.type)
									types.push(globalDef.type);

								if (globalDef.mutation) {
									mutations.push(globalDef.mutation);
								}

								if (globalDef.resolvers) {
									_.forIn(globalDef.resolvers, (r, name) => {
										resolvers[name] = _.merge(resolvers[name] || {}, this.createActionResolvers(serviceName, r));
									});
								}
							}

							// --- COMPILE ACTION-LEVEL DEFINITIONS ---
							const resolver = {
								Query: {},
								Mutation: {}
							};
							let filled = false;

							_.forIn(service.actions, action => {
								if (action.graphql) {
									if (_.isObject(action.graphql)) {
										const def = action.graphql;

										if (def.query) {
											const name = def.query.split(/[(:]/g)[0];
											queries.push(def.query);
											resolver.Query[name] = this.createActionResolver(action.name);
											filled = true;
										}

										if (def.type)
											types.push(def.type);

										if (def.mutation) {
											const name = def.mutation.split(/[(:]/g)[0];
											mutations.push(def.mutation);
											resolver.Mutation[name] = this.createActionResolver(action.name);
											filled = true;
										}

									}
								}
							});

							if (filled)
								resolvers = _.merge(resolvers, resolver);
						}

					});

					if (queries.length > 0 || types.length > 0 || mutations.length > 0) {
						let str = "";
						if (queries.length > 0) {
							str += `
								type Query {
									${queries.join("\n")}
								}
							`;
						}

						if (types.length > 0) {
							str += `
								${types.join("\n")}
							`;
						}

						if (mutations.length > 0) {
							str += `
								type Mutation {
									${mutations.join("\n")}
								}
							`;
						}

						typeDefs.push(str);
					}

					return makeExecutableSchema({ typeDefs, resolvers });

				} catch(err) {
					throw new MoleculerServerError("Unable to compile GraphQL schema", 500, "UNABLE_COMPILE_GRAPHQL_SCHEMA", { err });
				}
			}
		},

		created() {
			this.apolloServer = null;
			this.graphqlHandler = null;

			const route = {
				path: mixinOptions.routePath,

				aliases: {
					// multiload backend route
					"/"(req, res) {
						if (!shouldUpdateSchema && this.graphqlHandler)
							return this.graphqlHandler(req, res);

						// Create new server & handler
						this.logger.info("♻ Recreate Apollo GraphQL server and regenerate GraphQL schema...");

						try {
							const schema = this.generateGraphQLSchema();

							this.logger.debug(printSchema(schema));

							// https://www.apollographql.com/docs/apollo-server/v2/api/apollo-server.html
							const apolloServer = new ApolloServer({
								schema,
								//typeDefs: schema.typeDefs,
								//resolvers: schema.resolvers,
								context: ({ req }) => {
									return {
										ctx: req.$ctx,
										service: req.$service,
										params: req.$params,
									};
								},
							});

							this.graphqlHandler = apolloServer.createHandler();
							shouldUpdateSchema = false;

							// Call the newly created handler
							return this.graphqlHandler(req, res);

						} catch(err) {
							this.logger.warn(err);
							this.sendError(req, res, err);
						}
					}
				},

				mappingPolicy: "restrict",

				bodyParsers: {
					json: true,
					urlencoded: { extended: true }
				},
			};

			// Add route
			this.settings.routes.unshift(route);
		},

		started() {
			this.logger.info(`🚀 GraphQL server is available at ${mixinOptions.routePath}`);
		}
	};
};
