"use strict";

const pluralize = require("pluralize");
const _ = require("lodash");
const { capitalize, uncapitalize } = require("../libs/utils");

// Similar:
//   https://github.com/mcollina/mercurius-auto-schema
//   https://strapi.io/documentation/developer-docs/latest/development/plugins/graphql.html#shadow-crud
//   https://github.com/strapi/strapi/blob/master/packages/strapi-plugin-graphql/services/type-builder.js
//	 https://keystonejs.com/docs/apis/graphql

function convertTypeToGraphQLType(type) {
	if (["string", "boolean"].includes(type)) return capitalize(type);
	if (type == "number") return "Int";
	return type;
}

function getGraphqlType(field, isInput) {
	if (!field.graphql) return;
	return isInput ? field.graphql.inputType || field.graphql.type : field.graphql.type;
}

function getGraphqlTypeFromField(res, fieldName, field, kind) {
	// Primary key forbidden on create
	if (field.primaryKey && kind == "create" && field.generated != "user") return null;
	// Skip virtual fields in create/update/replace
	if (field.virtual && kind) return null;

	// Skip hidden fields
	if (field.hidden) return null;

	// Skip readonly fields in create/update/replace
	if (kind && field.readonly) return null;

	let gType = getGraphqlType(field, !!kind);
	let type = gType || field.type || "string";
	type = convertTypeToGraphQLType(type);

	if (field.graphql && field.graphql.query) {
		return {
			query: field.graphql.query,
			description: field.description
		};
	}

	// Skip not-well defined fields
	if (field.type == "object" && !field.properties) return;
	if (field.type == "array" && !field.items && !gType) return;

	if (field.type == "array" && !gType) {
		if (field.items.type == "object") {
			let gType = getGraphqlType(field.items, !!kind);
			let subTypeName = gType || `${res.entityName}${capitalize(pluralize(fieldName, 1))}`;
			if (kind) subTypeName = `${capitalize(kind)}${capitalize(subTypeName)}Input`;
			generateEntityGraphQLType(res, subTypeName, field.items.properties, kind);
			type = `[${subTypeName}]`;
		} else {
			type = `[${convertTypeToGraphQLType(gType || field.items.type)}]`;
		}
	} else if (field.type == "object") {
		let subTypeName = gType || `${res.entityName}${capitalize(pluralize(fieldName, 1))}`;
		if (kind) subTypeName = `${capitalize(kind)}${capitalize(subTypeName)}Input`;
		generateEntityGraphQLType(res, subTypeName, field.properties, kind);
		type = subTypeName;
	}

	// Required
	// If there is `set` we can't set the required maybe the value will be set in the `set`
	if (field.required && kind != "update" && !field.set && !field.default && !field.onCreate)
		type += "!";
	else if (field.primaryKey) type += "!";

	return {
		name: fieldName,
		type,
		description: field.description
	};
}

function generateEntityGraphQLType(res, typeName, fields, kind) {
	const content = ["{"];

	const entries = Object.entries(fields);
	entries.forEach(([fieldName, field]) => {
		const gType = getGraphqlTypeFromField(res, fieldName, field, kind);
		if (!gType) return;

		if (gType.description) {
			content.push(`"""${gType.description}"""`);
		}

		if (gType.query) {
			content.push(`    ${gType.query}`);
		} else {
			content.push(`    ${fieldName}: ${gType.type}`);
		}

		if (!kind && _.isPlainObject(field.populate)) {
			if (field.populate.action) {
				if (!res.resolvers[typeName]) res.resolvers[typeName] = {};

				res.resolvers[typeName][fieldName] = {
					action: field.populate.action,
					rootParams: field.populate.graphqlRootParams || {
						[fieldName]: "id"
					}
				};
			}
		}
	});

	content.push("}");

	res[kind ? "inputs" : "types"][typeName] = content.join("\n");
}

function generateMutation(res, fields, kind, description, additionalParams) {
	const mutationName = uncapitalize(res.entityName) + capitalize(kind);
	const inputName = `${capitalize(mutationName)}Input`;

	description = description ? `"""${description}"""\n` : "";

	switch (kind) {
		case "create":
		case "update":
		case "replace":
			generateEntityGraphQLType(res, inputName, fields, kind);
			return `${description}${mutationName}(input: ${inputName}!): ${res.entityName}!`;
		case "remove":
			return `${description}${mutationName}(id: String!${
				additionalParams ? ", " + additionalParams : ""
			}): String!`; // TODO: get type of primary key
	}
}

function generateAdditionalParams(res, params, commonParamList) {
	return _.compact(
		Object.keys(_.omit(params, commonParamList)).map(name => {
			const field = { ...params[name] };
			if (field.optional !== true) field.required = true;
			const gType = getGraphqlTypeFromField(res, name, field);
			if (!gType) return;
			return `${name}: ${gType.type}`;
		})
	).join(", ");
}

function generateCRUDGraphQL(name, schema) {
	const entityName = capitalize(pluralize(name, 1));
	const pluralizedName = pluralize(entityName);

	if (!schema.settings) return;
	if (!schema.settings.fields) return;
	if (!schema.actions) return;

	const res = {
		entityName,
		inputs: {},
		types: {},
		actions: {},
		resolvers: {}
		//queries: [],
		//mutations: []
	};

	if (!schema.settings.graphql) schema.settings.graphql = {};

	generateEntityGraphQLType(res, entityName, schema.settings.fields);

	Object.keys(schema.actions).forEach(actionName => {
		const actionDef = schema.actions[actionName];
		const visibility = actionDef.visibility || "published";
		if (actionDef.rest && actionDef.graphql == null && visibility == "published") {
			// CREATE action
			if (actionName == "create") {
				actionDef.graphql = {
					mutation: generateMutation(
						res,
						schema.settings.fields,
						actionName,
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
						actionName,
						`Update an existing ${name}`
					)
				};
			}

			// REPLACE action
			if (actionName == "replace") {
				actionDef.graphql = {
					mutation: generateMutation(
						res,
						schema.settings.fields,
						actionName,
						`Replace an existing ${name}`
					)
				};
			}

			// REMOVE action
			if (actionName == "remove") {
				const additionalParams = generateAdditionalParams(res, actionDef.params, ["id"]);

				actionDef.graphql = {
					mutation: generateMutation(
						res,
						schema.settings.fields,
						actionName,
						`Delete an existing ${name}`,
						additionalParams
					)
				};
			}

			// FIND action
			if (actionName == "find") {
				const additionalParams = generateAdditionalParams(res, actionDef.params, [
					"limit",
					"offset",
					"fields",
					"sort",
					"search",
					"searchFields",
					"scope",
					"populate",
					"query"
				]);

				actionDef.graphql = {
					query: `"""Find all ${name}s"""\n${uncapitalize(pluralizedName)}All(${
						additionalParams ? additionalParams + ", " : ""
					}limit: Int, offset: Int, fields: [String], sort: [String], search: String, searchFields: [String], scope: [String], query: JSON): [${entityName}]`
				};
			}

			// LIST action
			if (actionName == "list") {
				const listResName = `${entityName}ListResponse`;
				res.types[listResName] = [
					"{",
					"    total: Int!",
					"    page: Int!",
					"    pageSize: Int!",
					"    totalPages: Int!",
					`    rows: [${entityName}]!`,
					"}"
				].join("\n");

				const additionalParams = generateAdditionalParams(res, actionDef.params, [
					"page",
					"pageSize",
					"fields",
					"sort",
					"search",
					"searchFields",
					"scope",
					"populate",
					"query"
				]);

				actionDef.graphql = {
					query: `"""List ${uncapitalize(
						pluralizedName
					)} (with pagination)"""\n${uncapitalize(pluralizedName)}(${
						additionalParams ? additionalParams + ", " : ""
					}page: Int, pageSize: Int, fields: [String], sort: [String], search: String, searchFields: [String], scope: [String], query: JSON): ${listResName}`
				};
			}

			// COUNT action
			if (actionName == "count") {
				const additionalParams = generateAdditionalParams(res, actionDef.params, [
					"search",
					"searchFields",
					"scope",
					"query"
				]);

				actionDef.graphql = {
					query: `"""Number of ${pluralizedName}"""\n${uncapitalize(
						pluralizedName
					)}Count(${
						additionalParams ? additionalParams + ", " : ""
					}search: String, searchFields: [String], scope: [String], query: JSON): Int!`
				};
			}

			// GET action
			if (actionName == "get") {
				const additionalParams = generateAdditionalParams(res, actionDef.params, [
					"id",
					"fields",
					"scope",
					"populate"
				]);

				actionDef.graphql = {
					query: `"""Get a ${name} by ID"""\n${uncapitalize(
						pluralize(entityName, 1)
					)}ById(${
						additionalParams ? additionalParams + ", " : ""
					}id: String!, fields: [String], scopes: [String]): ${entityName}`
				};
			}

			// RESOLVE action
			if (actionName == "resolve") {
				const additionalParams = generateAdditionalParams(res, actionDef.params, [
					"id",
					"fields",
					"scope",
					"populate",
					"mapping",
					"throwIfNotExist"
				]);
				actionDef.graphql = {
					query: `"""Resolve one or more ${pluralizedName} by IDs"""\n${uncapitalize(
						pluralizedName
					)}ByIds(${
						additionalParams ? additionalParams + ", " : ""
					}id: [String]!, fields: [String], scopes: [String], mapping: Boolean, throwIfNotExist: Boolean): [${entityName}]`
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

	return res;
}

module.exports = {
	generateCRUDGraphQL
};
