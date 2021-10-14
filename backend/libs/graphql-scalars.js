const Kind = require("graphql/language").Kind;
const { GraphQLJSONObject } = require("graphql-type-json");
const GraphQLLong = require("graphql-type-long");

module.exports = {
	typeDefs: `
		scalar Date
		scalar JSON
		scalar Long
	`,
	resolvers: {
		Date: {
			__parseValue: value => new Date(value), // value from the client
			__serialize: value => value.getTime(), // value sent to the client
			__parseLiteral: ast => (ast.kind === Kind.INT ? parseInt(ast.value, 10) : null) // ast value is always in string format
		},
		JSON: GraphQLJSONObject,
		Long: GraphQLLong
	}
};
