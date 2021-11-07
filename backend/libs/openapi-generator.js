"use strict";

const pluralize = require("pluralize");
const _ = require("lodash");
const { Service } = require("moleculer");

const { capitalize, uncapitalize } = require("../libs/utils");

/*
	TODO:
		- generate OpenAPI schema of actions from action.params
 */

function convertTypeToOpenAPIType(type) {
	if (!["string", "boolean", "number", "array", "object"].includes(type)) return "string";
	return type;
}

function getOpenAPIType(field) {
	return (field.openapi && field.openapi.type ? field.openapi.type : field.type) || "string";
}

function generateEntityOpenAPISchemas(target, typeName, fields, kind) {
	const entity = {};
	const requiredList = [];

	const entries = Object.entries(fields);
	entries.forEach(([name, field]) => {
		// Primary key forbidden on create
		if (field.primaryKey && kind == "create" && field.generated != "user") return null;
		// Skip virtual fields in create/update/replace
		if (field.virtual && kind) return null;

		// Skip hidden fields
		if (field.hidden) return null;

		// Skip readonly fields in create/update/replace
		if (kind && field.readonly) return null;

		// Skip in create if it has a hook
		if (kind == "create" && field.onCreate) return null;

		// Skip not-well defined fields
		if (field.type == "object" && !field.properties) return;
		if (field.type == "array" && !field.items) return;

		let type = getOpenAPIType(field);
		type = convertTypeToOpenAPIType(type);

		const obj = { type };
		if (field.description) obj.description = field.description;

		// Required
		if (field.required && kind != "update" && !field.set && !field.onCreate) {
			requiredList.push(name);
		}

		if (field.type == "array" && field.items) {
			if (field.items.type == "object") {
				//const subType = getOpenAPIType(field.items);
				let subTypeName = `${typeName}${capitalize(pluralize(name, 1))}`;
				//if (kind) subTypeName = `${kind}${capitalize(subTypeName)}Input`;
				generateEntityOpenAPISchemas(target, subTypeName, field.items.properties, kind);
				obj.items = { $ref: `#/components/schemas/${subTypeName}` };
			} else {
				obj.items = { type: convertTypeToOpenAPIType(field.items.type) };
			}
		}

		if (field.openapi && field.openapi.example) obj.example = field.openapi.example;

		entity[name] = obj;
	});

	target[typeName] = {
		required: requiredList.length > 0 ? requiredList : undefined,
		type: "object",
		properties: entity
	};

	return target[typeName];
}

function makeOpenAPIPath(basePath, actionRest) {
	const parts = actionRest.split(" ");
	const method = parts.shift();
	let path = parts.join("/");
	if (!path.startsWith("/")) path = "/" + path;

	path = path.replace(/:([a-zA-Z]+)/, "{$1}");
	if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

	return `${method} ${basePath}${path}`;
}

function generateActionOpenAPISchema(
	actionDef,
	fields,
	{ serviceSchema, serviceBasePath, entityName, actionName, kind, tagName, description }
) {
	const inputName = `${entityName + capitalize(kind)}Input`;

	const res = {
		$path: makeOpenAPIPath(serviceBasePath, actionDef.rest),
		tags: [tagName],
		operationId: actionName
	};

	if (description) res.description = description;

	if (kind != "create") {
		res.parameters = [
			{
				name: "id",
				in: "path",
				required: true,
				schema: { type: "string" },
				description: `${entityName} ID`
			}
		];
	}

	switch (kind) {
		case "create":
		case "update":
		case "replace":
			generateEntityOpenAPISchemas(
				serviceSchema.settings.openapi.components.schemas,
				inputName,
				fields,
				kind
			);
			res.requestBody = {
				content: {
					"application/json": {
						schema: { $ref: `#/components/schemas/${inputName}` }
					}
				}
			};
			res.responses = {
				200: {
					description:
						kind == "create"
							? `Created ${uncapitalize(entityName)}`
							: `Updated ${uncapitalize(entityName)}`,
					content: {
						"application/json": {
							schema: { $ref: `#/components/schemas/${entityName}` }
						}
					}
				}
			};
			break;
		case "remove":
			res.responses = {
				200: {
					description: `Deleted ${uncapitalize(entityName)} ID`,
					content: {
						"application/json": {
							schema: { type: "string" } // TODO: get type of primary key
						}
					}
				}
			};
			break;
	}

	return res;
}

function generateOpenAPISchema(name, schema) {
	const pluralizedName = pluralize(name);
	const entityName = capitalize(pluralize(name, 1));
	const pluralizedEntityName = pluralize(entityName);

	if (!schema.settings.rest) return;
	if (!schema.settings.fields) return;
	if (!schema.actions) return;

	const isDatabaseService = !!(
		schema.metadata &&
		schema.metadata.$package &&
		schema.metadata.$package.name == "@moleculer/database"
	);
	const serviceFullName = Service.getVersionedFullName(schema.name, schema.version);

	const serviceBasePath =
		schema.settings.rest === true
			? "/" + serviceFullName.replace(/\./, "/")
			: schema.settings.rest;

	const tagName = uncapitalize(pluralizedEntityName);
	schema.settings.openapi = _.defaultsDeep(schema.settings.openapi, {
		components: { schemas: {} },
		tags: [
			{
				name: tagName,
				description: `${capitalize(pluralizedEntityName)} operations`
			}
		]
	});

	generateEntityOpenAPISchemas(
		schema.settings.openapi.components.schemas,
		entityName,
		schema.settings.fields
	);

	Object.keys(schema.actions).forEach(actionName => {
		const actionDef = schema.actions[actionName];
		const visibility = actionDef.visibility || "published";
		const actionFullName = `${serviceFullName}.${actionDef.name || actionName}`;
		if (actionDef.rest && actionDef.openapi == null && visibility == "published") {
			// CREATE action
			if (actionName == "create") {
				actionDef.openapi = generateActionOpenAPISchema(actionDef, schema.settings.fields, {
					serviceSchema: schema,
					serviceBasePath,
					entityName,
					actionName: actionFullName,
					kind: "create",
					tagName,
					description: actionDef.description || `Create a new ${name}`
				});
			}

			// UPDATE action
			if (actionName == "update") {
				actionDef.openapi = generateActionOpenAPISchema(actionDef, schema.settings.fields, {
					serviceSchema: schema,
					serviceBasePath,
					entityName,
					actionName: actionFullName,
					tagName,
					kind: "update",
					description: actionDef.description || `Update an existing ${name}`
				});
			}

			// REPLACE action
			if (actionName == "replace") {
				actionDef.openapi = generateActionOpenAPISchema(actionDef, schema.settings.fields, {
					serviceSchema: schema,
					serviceBasePath,
					entityName,
					actionName: actionFullName,
					tagName,
					kind: "replace",
					description: actionDef.description || `Replace an existing ${name}`
				});
			}

			// REMOVE action
			if (actionName == "remove") {
				actionDef.openapi = generateActionOpenAPISchema(actionDef, schema.settings.fields, {
					serviceSchema: schema,
					serviceBasePath,
					entityName,
					actionName: actionFullName,
					tagName,
					kind: "remove",
					description: actionDef.description || `Delete an existing ${name}`
				});
			}

			// FIND action
			if (actionName == "find") {
				schema.settings.openapi.components.schemas[pluralizedEntityName] = {
					type: "array",
					items: {
						$ref: `#/components/schemas/${entityName}`
					}
				};

				actionDef.openapi = {
					$path: makeOpenAPIPath(serviceBasePath, actionDef.rest),
					description: actionDef.description || `Find ${pluralizedName}`,
					tags: [tagName],
					operationId: actionFullName,
					parameters: [
						{ name: "limit", in: "query", required: false, schema: { type: "number" } },
						{
							name: "offset",
							in: "query",
							required: false,
							schema: { type: "number" }
						},
						{
							name: "fields",
							in: "query",
							required: false,
							schema: { type: "array", items: { type: "string" } }
						},
						{
							name: "sort",
							in: "query",
							required: false,
							schema: { type: "array", items: { type: "string" } }
						},
						{
							name: "search",
							in: "query",
							required: false,
							schema: { type: "string" }
						},
						{
							name: "searchFields",
							in: "query",
							required: false,
							schema: { type: "array", items: { type: "string" } }
						},
						{
							name: "collation",
							in: "query",
							required: false,
							schema: { type: "string" }
						},
						{
							name: "scope",
							in: "query",
							required: false,
							schema: { type: "array", items: { type: "string" } }
						},
						{
							name: "populate",
							in: "query",
							required: false,
							schema: { type: "array", items: { type: "string" } }
						},
						{ name: "query", in: "query", required: false, schema: { type: "object" } }
					],
					responses: {
						200: {
							description: `Found ${pluralizedName}`,
							content: {
								"application/json": {
									schema: {
										$ref: `#/components/schemas/${pluralizedEntityName}`
									}
								}
							}
						}
					}
				};
			}

			// LIST action
			if (actionName == "list") {
				const listResName = `${entityName}List`;
				schema.settings.openapi.components.schemas[listResName] = {
					required: ["total", "page", "pageSize", "totalPages", "rows"],
					type: "object",
					properties: {
						total: { type: "integer" },
						page: { type: "integer" },
						pageSize: { type: "integer" },
						totalPages: { type: "integer" },
						rows: {
							type: "array",
							items: {
								$ref: `#/components/schemas/${entityName}`
							}
						}
					}
				};

				actionDef.openapi = {
					$path: makeOpenAPIPath(serviceBasePath, actionDef.rest),
					description:
						actionDef.description || `List ${pluralizedName} (with pagination)`,
					tags: [tagName],
					operationId: actionFullName,
					parameters: [
						{ name: "page", in: "query", required: false, schema: { type: "number" } },
						{
							name: "pageSize",
							in: "query",
							required: false,
							schema: { type: "number" }
						},
						{
							name: "fields",
							in: "query",
							required: false,
							schema: { type: "array", items: { type: "string" } }
						},
						{
							name: "sort",
							in: "query",
							required: false,
							schema: { type: "array", items: { type: "string" } }
						},
						{
							name: "search",
							in: "query",
							required: false,
							schema: { type: "string" }
						},
						{
							name: "searchFields",
							in: "query",
							required: false,
							schema: { type: "array", items: { type: "string" } }
						},
						{
							name: "collation",
							in: "query",
							required: false,
							schema: { type: "string" }
						},
						{
							name: "scope",
							in: "query",
							required: false,
							schema: { type: "array", items: { type: "string" } }
						},
						{
							name: "populate",
							in: "query",
							required: false,
							schema: { type: "array", items: { type: "string" } }
						},
						{ name: "query", in: "query", required: false, schema: { type: "object" } }
					],
					responses: {
						200: {
							description: `Paginated list of found ${pluralizedName}`,
							content: {
								"application/json": {
									schema: {
										$ref: `#/components/schemas/${listResName}`
									}
								}
							}
						}
					}
				};
			}

			// COUNT action
			if (actionName == "count") {
				actionDef.openapi = {
					$path: makeOpenAPIPath(serviceBasePath, actionDef.rest),
					description: `Number of ${pluralizedName}`,
					tags: [tagName],
					operationId: actionFullName,
					parameters: [
						{
							name: "search",
							in: "query",
							required: false,
							schema: { type: "string" }
						},
						{
							name: "searchFields",
							in: "query",
							required: false,
							schema: { type: "array", items: { type: "string" } }
						},
						{
							name: "scope",
							in: "query",
							required: false,
							schema: { type: "array", items: { type: "string" } }
							// TODO: boolean|string|string[]
						},
						{ name: "query", in: "query", required: false, schema: { type: "object" } }
					],
					responses: {
						200: {
							description: `Number of ${pluralizedName}`,
							content: {
								"application/json": {
									schema: {
										type: "number"
									}
								}
							}
						}
					}
				};
			}

			// GET action
			if (actionName == "get") {
				actionDef.openapi = {
					$path: makeOpenAPIPath(serviceBasePath, actionDef.rest),
					description: actionDef.description || `Get a ${name} by ID`,
					tags: [tagName],
					operationId: actionFullName,
					parameters: [
						{
							name: "id",
							in: "path",
							required: true,
							schema: { type: "string" }, // TODO: get primaryKey type
							description: `${entityName} ID`
						},
						{
							name: "fields",
							in: "query",
							required: false,
							schema: { type: "array", items: { type: "string" } }
						},
						{
							name: "scope",
							in: "query",
							required: false,
							schema: { type: "array", items: { type: "string" } }
						},
						{
							name: "populate",
							in: "query",
							required: false,
							schema: { type: "array", items: { type: "string" } }
						}
					],
					responses: {
						200: {
							description: `Found ${name}`,
							content: {
								"application/json": {
									schema: {
										$ref: `#/components/schemas/${entityName}`
									}
								}
							}
						}
					}
				};
			}
		}
	});
}

module.exports = {
	generateOpenAPISchema
};
