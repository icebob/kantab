"use strict";

const pluralize = require("pluralize");
const _ = require("lodash");

// Similar:
//   https://github.com/mcollina/mercurius-auto-schema
//   https://strapi.io/documentation/developer-docs/latest/development/plugins/graphql.html#shadow-crud
//   https://github.com/strapi/strapi/blob/master/packages/strapi-plugin-graphql/services/type-builder.js
//	 https://keystonejs.com/docs/apis/graphql

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

function getGraphqlType(field, isInput) {
	return isInput ? field.graphqlInputType || field.graphqlType : field.graphqlType;
}

function generateEntityGraphQLType(res, typeName, fields, kind) {
	const content = ["{"];

	const entries = Object.entries(fields);
	entries.forEach(([name, field]) => {
		// Primary key forbidden on create
		if (field.primaryKey && kind == "create" && field.generated != "user") return null;
		// Skip virtual fields in create/update/replace
		if (field.virtual && kind) return null;

		// Skip readonly fields in create/update/replace
		if (kind && field.readonly) return null;

		// Skip in create if it has a hook
		if (kind == "create" && field.onCreate) return null;

		let gType = getGraphqlType(field, !!kind);
		let type = gType || field.type || "string";
		type = convertTypeToGraphQLType(type);

		// Skip not-well defined fields
		if (type == "object" && !field.properties) return;
		if (type == "array" && !field.items) return;

		let description;
		if (field.description) {
			description = `"""${field.description}"""`;
		} else {
			//description = `"""Field of ${name}"""`;
		}

		if (field.type == "array") {
			if (field.items.type == "object") {
				let gType = getGraphqlType(field.items, !!kind);
				let subTypeName = gType || `${res.entityName}${capitalize(pluralize(name, 1))}`;
				if (kind) subTypeName = `${kind}${capitalize(subTypeName)}Input`;
				generateEntityGraphQLType(res, subTypeName, field.items.properties, kind);
				type = `[${subTypeName}]`;
			} else {
				type = `[${convertTypeToGraphQLType(gType || field.items.type)}]`;
			}
		}

		// Required
		// If there is `set` we can't set the required maybe the value will be set in the `set`
		if (field.required && kind != "update" && !field.set && !field.onCreate) type += "!";
		else if (field.primaryKey) type += "!";

		if (description) {
			content.push(description);
		}
		content.push(`    ${name}: ${type}`);

		if (!kind && _.isPlainObject(field.populate)) {
			if (field.populate.action) {
				if (!res.resolvers[typeName]) res.resolvers[typeName] = {};

				res.resolvers[typeName][name] = {
					action: field.populate.action,
					rootParams: field.populate.graphqlRootParams || {
						[name]: "id"
					}
				};
			}
		}
	});

	content.push("}");

	res[kind ? "inputs" : "types"][typeName] = content.join("\n");
}

function generateMutation(res, fields, kind, description) {
	const mutationName = kind + capitalize(res.entityName);
	const inputName = `${capitalize(mutationName)}Input`;

	description = description ? `"""${description}"""\n` : "";

	switch (kind) {
		case "create":
		case "update":
		case "replace":
			generateEntityGraphQLType(res, inputName, fields, kind);
			return `${description}${mutationName}(input: ${inputName}!): ${res.entityName}!`;
		case "remove":
			return `${description}${mutationName}(id: String!): String!`;
	}
}

function generateCRUDGraphQL(name, schema) {
	const entityName = capitalize(pluralize(name, 1));
	if (schema.settings.fields) {
		const res = {
			entityName,
			inputs: {},
			types: {},
			actions: {},
			resolvers: {}
			//queries: [],
			//mutations: []
		};

		if (schema.actions) {
			if (!schema.settings.graphql) schema.settings.graphql = {};

			generateEntityGraphQLType(res, entityName, schema.settings.fields);

			Object.keys(schema.actions).forEach(actionName => {
				const actionDef = schema.actions[actionName];
				if (actionDef.graphql == null) {
					// CREATE action
					if (actionName == "create") {
						actionDef.graphql = {
							mutation: generateMutation(
								res,
								schema.settings.fields,
								"create",
								`Create a new ${name}`
							)
						};
					}

					// UPDATE action
					if (actionName == "update") {
						actionDef.graphql = {
							mutation: generateMutation(
								res,
								schema.settings.fields,
								"update",
								`Create an existing ${name}`
							)
						};
					}

					// REPLACE action
					if (actionName == "replace") {
						actionDef.graphql = {
							mutation: generateMutation(
								res,
								schema.settings.fields,
								"replace",
								`Replace an existing ${name}`
							)
						};
					}

					// REMOVE action
					if (actionName == "remove") {
						actionDef.graphql = {
							mutation: generateMutation(
								res,
								schema.settings.fields,
								"remove",
								`Delete an existing ${name}`
							)
						};
					}

					// FIND action
					if (actionName == "find") {
						actionDef.graphql = {
							query: `"""Find ${name}s"""\n${uncapitalize(
								pluralize(entityName)
							)}(limit: Int, offset: Int, fields: [String], sort: [String], search: String, searchFields: [String], scopes: [String], query: JSON): [${entityName}]`
						};
					}

					// LIST action
					if (actionName == "list") {
						const listResName = `${entityName}List`;
						res.types[listResName] = [
							"{",
							"    total: Int!",
							"    page: Int!",
							"    pageSize: Int!",
							"    totalPages: Int!",
							`    rows: [${entityName}]!`,
							"}"
						].join("\n");

						actionDef.graphql = {
							query: `"""List ${name}s (paginated)"""\n${uncapitalize(
								pluralize(entityName)
							)}List(page: Int, pageSize: Int, fields: [String], sort: [String], search: String, searchFields: [String], scopes: [String], query: JSON): ${listResName}`
						};
					}

					// COUNT action
					if (actionName == "count") {
						actionDef.graphql = {
							query: `"""Number of ${name}s"""\n${uncapitalize(
								pluralize(entityName)
							)}Count(search: String, searchFields: [String], scope: [String], query: JSON): Int!`
						};
					}

					// GET action
					if (actionName == "get") {
						actionDef.graphql = {
							query: `"""Get a ${name} by ID"""\n${uncapitalize(
								pluralize(entityName, 1)
							)}(id: String!, fields: [String], scopes: [String]): Board`
						};
					}

					// RESOLVE action
					if (actionName == "resolve") {
						actionDef.graphql = {
							query: `"""Resolve one or more ${name}s by IDs"""\n${uncapitalize(
								pluralize(entityName)
							)}ByIds(id: [String]!, fields: [String], scopes: [String], mapping: Boolean, throwIfNotExist: Boolean): [Board]`
						};
					}
				}
			});

			const types = Object.entries(res.types);
			const inputs = Object.entries(res.inputs);
			if (types.length > 0 || inputs.length > 0) {
				if (!schema.settings.graphql.type) schema.settings.graphql.type = "";

				types.forEach(([name, str]) => {
					schema.settings.graphql.type += `\n\ntype ${name} ${str}`;
				});

				inputs.forEach(([name, str]) => {
					schema.settings.graphql.type += `\n\ninput ${name} ${str}`;
				});
			}
			const resolvers = Object.entries(res.resolvers);
			if (resolvers.length > 0) {
				if (!schema.settings.graphql.resolvers) schema.settings.graphql.resolvers = {};

				resolvers.forEach(([name, resolver]) => {
					schema.settings.graphql.resolvers[name] = resolver;
				});
			}
		}

		return res;
	}
}

module.exports = {
	generateCRUDGraphQL
};
