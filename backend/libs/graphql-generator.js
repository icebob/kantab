"use strict";

const pluralize = require("pluralize");

// Similar:
//   https://github.com/mcollina/mercurius-auto-schema
//   https://strapi.io/documentation/developer-docs/latest/development/plugins/graphql.html#shadow-crud
//   https://github.com/strapi/strapi/blob/master/packages/strapi-plugin-graphql/lib/graphql-generator.js
//	 https://keystonejs.com/docs/apis/graphql

// Other tools
//   https://github.com/plurals/pluralize

/*
 - [ ] Use "input" types for mutations. "CreateBoardInput", "UpdateBoardInput", "ReplaceBoardInput"
		createBoard(input: CreateBoardInput!): Board!
		updateBoard(id: String!, input: UpdateBoardInput!): Board!
		replaceBoard(id: String!, input: ReplaceBoardInput!): Board!
		removeBoard(id: String!): String!

 - [ ] Type for listing "BoardListParams"
		type BoardListParams {
			limit: Int
			offset: Int
			...
		}

*/

function capitalize(str) {
	return str[0].toUpperCase() + str.slice(1);
}

function uncapitalize(str) {
	return str[0].toLowerCase() + str.slice(1);
}

function convertTypeToGraphQLType(type) {
	if (["string", "boolean"].includes(type)) return capitalize(type);
	if (type == "number") return "Int";
	return type;
}

function generateEntityGraphQLType(res, typeName, fields, kind) {
	const content = [`type ${typeName} {`];

	const entries = Object.entries(fields);
	entries.forEach(([name, field], idx) => {
		// Primary key forbidden on create
		if (field.primaryKey && kind == "create" && field.generated != "user") return null;

		let type = field.graphqlType || field.type || "string";
		type = convertTypeToGraphQLType(type);

		// Skip not-well defined fields
		if (type == "object" && !field.properties) return;
		if (type == "array" && !field.items) return;

		if (field.type == "array") {
			if (field.items.type == "object") {
				const subTypeName =
					field.items.graphqlName || `${res.entityName}${capitalize(pluralize(name, 1))}`;
				if (!kind) generateEntityGraphQLType(res, subTypeName, field.items.properties);
				type = `[${subTypeName}]`;
			} else {
				type = `[${convertTypeToGraphQLType(field.graphqlType || field.items.type)}]`;
			}
		}

		// Required
		// If there is `set` we can't set the required maybe the value will be set in the `set`
		if (field.required && kind != "update" && !field.set) type += "!";
		else if (field.primaryKey) type += "!";

		content.push(`    ${name}: ${type}`);
	});

	content.push("}");

	res.types.push(content.join("\n"));
}

function generateMutation(res, fields, kind) {
	const mutationName = kind + capitalize(res.entityName);
	const inputName = `${capitalize(mutationName)}Input`;

	switch (kind) {
		case "create":
		case "update":
		case "replace":
			generateEntityGraphQLType(res, inputName, fields, kind);
			res.mutations.push(`${mutationName}(input: ${inputName}!): ${res.entityName}!`);
			break;
		case "delete":
			res.mutations.push(`${mutationName}(id: String!): String!`);
			break;
	}
}

function generateCRUDMutations(res, fields) {
	generateMutation(res, fields, "create");
	generateMutation(res, fields, "update");
	generateMutation(res, fields, "replace");
	generateMutation(res, fields, "delete");
}

function generateCRUDQueries(res, fields) {
	// Find
	res.queries.push(
		`${uncapitalize(
			pluralize(res.entityName)
		)}(limit: Int, offset: Int, fields: [String], sort: [String], search: String, searchFields: [String], scopes: [String], populate: [String], query: JSON): [${
			res.entityName
		}]`
	);

	// List
	const listResName = `${res.entityName}List`;
	res.types.push(
		[
			`type ${listResName} {`,
			"    total: Int!",
			"    page: Int!",
			"    pageSize: Int!",
			"    totalPages: Int!",
			"    rows: [${res.entityName}]!",
			"}"
		].join("\n")
	);

	res.queries.push(
		`${uncapitalize(
			pluralize(res.entityName)
		)}List(page: Int, pageSize: Int, fields: [String], sort: [String], search: String, searchFields: [String], scopes: [String], populate: [String], query: JSON): ${listResName}`
	);

	// Count
	res.queries.push(
		`${uncapitalize(
			pluralize(res.entityName)
		)}Count(search: String, searchFields: [String], scope: [String], query: JSON): Int!`
	);

	// Get
	res.queries.push(
		`${uncapitalize(
			pluralize(res.entityName, 1)
		)}(id: String!, fields: [String], scopes: [String], populate: [String]): Board`
	);

	// Resolve
	res.queries.push(
		`${uncapitalize(
			pluralize(res.entityName)
		)}ByIds(id: [String]!, fields: [String], scopes: [String], populate: [String], mapping: Boolean, throwIfNotExist: Boolean): [Board]`
	);
}

function generateCRUDGraphQL(name, schema) {
	const entityName = capitalize(pluralize(name, 1));
	if (schema.settings.fields) {
		const res = {
			entityName,
			types: [],
			queries: [],
			mutations: []
		};
		generateEntityGraphQLType(res, entityName, schema.settings.fields);
		generateCRUDQueries(res, schema.settings.fields);
		generateCRUDMutations(res, schema.settings.fields);

		return res;
	}
}

module.exports = {
	convertTypeToGraphQLType,
	generateCRUDGraphQL
};
