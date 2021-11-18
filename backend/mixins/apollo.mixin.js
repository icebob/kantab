"use strict";

const fs = require("fs");

const { ApolloService } = require("moleculer-apollo-server");

const { GraphQLError } = require("graphql");
const Kind = require("graphql/language").Kind;
const { GraphQLJSONObject } = require("graphql-type-json");
const GraphQLLong = require("graphql-type-long");

const depthLimit = require("graphql-depth-limit");
const { createComplexityLimitRule } = require("graphql-validation-complexity");

module.exports = {
	mixins: [
		// GraphQL
		ApolloService({
			typeDefs: `
				scalar Date
				scalar JSON
				scalar Long
			`,

			resolvers: {
				Date: {
					__parseValue(value) {
						return new Date(value); // value from the client
					},
					__serialize(value) {
						return value.getTime(); // value sent to the client
					},
					__parseLiteral(ast) {
						if (ast.kind === Kind.INT) return parseInt(ast.value, 10); // ast value is always in string format

						return null;
					}
				},
				JSON: GraphQLJSONObject,
				Long: GraphQLLong
			},

			routeOptions: {
				authentication: true,
				cors: {
					origin: "*"
				}
			},

			// https://www.apollographql.com/docs/apollo-server/v2/api/apollo-server.html
			serverOptions: {
				tracing: false,
				introspection: true,

				validationRules: [
					depthLimit(10),
					createComplexityLimitRule(1000, {
						createError(cost, documentNode) {
							const error = new GraphQLError("custom error", [documentNode]);
							error.meta = { cost };
							return error;
						}
					})
				]
			}
		})
	],

	methods: {
		/**
		 * Prepare context params for GraphQL requests.
		 *
		 * @param {Object} params
		 * @param {String} actionName
		 * @returns {Boolean}
		 */
		prepareContextParams(params, actionName) {
			if (params.input) {
				if ([".create", ".update", ".replace"].some(method => actionName.endsWith(method)))
					return params.input;
			}
			return params;
		}
	},

	events: {
		"graphql.schema.updated"({ schema }) {
			this.logger.info("Generated GraphQL schema:\n\n" + schema);
			fs.writeFileSync("./schema.gql", schema, "utf8");
		}
	}
};
