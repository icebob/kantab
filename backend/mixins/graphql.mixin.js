"use strict";

const _ 					= require("lodash");

const { ApolloServer, gql } = require("./apollo-server-moleculer");

module.exports = function(mixinOptions) {

	mixinOptions = _.defaultsDeep(mixinOptions, {
		routePath: "/graphql"
	});

	// Construct a schema, using GraphQL schema language
	const typeDefs = gql`
		type Query {
			hello: String
		}
	`;

	// Provide resolver functions for your schema fields
	const resolvers = {
		Query: {
			hello: () => "Hello world!",
		},
	};

	// https://www.apollographql.com/docs/apollo-server/v2/api/apollo-server.html
	const apolloServer = new ApolloServer({ typeDefs, resolvers });

	return {

		created() {

			const route = {
				path: mixinOptions.routePath,

				aliases: {
					// multiload backend route
					"/": apolloServer.createHandler()
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
			this.logger.info(`🚀 GraphQL server ready at http://localhost:4000${mixinOptions.routePath}`);
		}
	};
};
