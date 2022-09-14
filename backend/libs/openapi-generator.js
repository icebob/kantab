"use strict";

const pluralize = require("pluralize");
const _ = require("lodash");
const { Service } = require("moleculer");
const Validator = require("fastest-validator");
const validator = new Validator();

const { capitalize, uncapitalize } = require("../libs/utils");

function convertType(type) {
	if (!["string", "boolean", "number", "array", "object"].includes(type)) return "string";
	return type;
}

function getType(field) {
	return (field.openapi && field.openapi.type ? field.openapi.type : field.type) || "string";
}

function generateEntityType(target, typeName, fields, kind) {
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

		const type = convertType(getType(field));

		const obj = { type };
		if (field.description) obj.description = field.description;

		// Required
		if (field.required && kind != "update" && !field.set && !field.onCreate) {
			requiredList.push(name);
		}

		if (field.type == "array" && field.items) {
			if (field.items.type == "object") {
				// Create a sub-entity
				let subTypeName = `${typeName}${capitalize(pluralize(name, 1))}`;
				generateEntityType(target, subTypeName, field.items.properties, kind);
				obj.items = { $ref: `#/components/schemas/${subTypeName}` };
			} else {
				obj.items = { type: convertType(field.items.type) };
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

function convertFVToJsonSchema(def) {
	def = _.isString(def) ? validator.parseShortHand(def) : def;

	if (Array.isArray(def)) {
		return { oneOf: def.map(convertFVToJsonSchema) };
	}

	const res = {
		type: convertType(getType(def))
	};

	if (def.type == "array" && def.items) {
		res.items = convertFVToJsonSchema(def.items);
	}

	if (def.type == "object" && def.properties) {
		res.properties = {};
		for (const [name, param] of Object.entries(def.properties)) {
			if (name.startsWith("$$")) continue;
			res.properties[name] = convertFVToJsonSchema(param);
		}
	}

	return res;
}

function makeOpenAPIPath(basePath, actionRest) {
	const parts = actionRest.split(" ");
	const method = parts.shift().toUpperCase();
	let path = parts.join("/");
	if (!path.startsWith("/")) path = "/" + path;

	path = basePath + path.replace(/:([a-zA-Z]+)/, "{$1}");
	if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

	return { method, path };
}

function generateActionOpenAPISchema(
	actionDef,
	{ schema, basePath, entityName, actionName, actionFullName, tagName, isDatabaseService }
) {
	const pluralizedEntityName = pluralize(entityName);
	const pluralizedLabel = uncapitalize(pluralize(entityName));
	const entityLabel = uncapitalize(entityName);

	const res = {
		$path: makeOpenAPIPath(basePath, actionDef.rest),
		tags: [tagName],
		operationId: actionFullName
	};

	const hasBody = ["POST", "PUT", "PATCH"].includes(res.$path.method);
	res.parameters = [];

	const body = {};
	if (hasBody) {
		res.requestBody = {
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: body
					}
				}
			}
		};
	}

	// Convert FV params to OpenAPI JSON Schema
	for (const [name, param] of Object.entries(actionDef.params)) {
		if (name.startsWith("$$")) continue;

		const isInPath = res.$path.path.includes(`{${name}}`);

		const obj = convertFVToJsonSchema(param);

		if (isInPath || !hasBody) {
			const optional = Array.isArray(param)
				? param.every(item => item.optional)
				: param.optional;

			res.parameters.push({
				name,
				in: isInPath ? "path" : "query",
				required: !optional,
				schema: obj
			});
		} else {
			if (param.description) obj.description = param.description;
			body[name] = obj;
		}
	}

	if (actionDef.description) res.summary = actionDef.description;

	if (isDatabaseService) {
		switch (actionName) {
			case "create": {
				if (!res.summary) res.summary = `Create a new ${entityLabel}`;
				res.responses = {
					200: {
						description: `Created ${entityName}`,
						content: {
							"application/json": {
								schema: {
									$ref: `#/components/schemas/${entityName}`
								}
							}
						}
					}
				};
				break;
			}
			case "update":
			case "replace": {
				if (!res.summary) res.summary = `Update an existing ${entityLabel}`;
				res.responses = {
					200: {
						description: `Updated ${entityName}`,
						content: {
							"application/json": {
								schema: {
									$ref: `#/components/schemas/${entityName}`
								}
							}
						}
					}
				};
				break;
			}
			case "remove": {
				if (!res.summary) res.summary = `Remove an existing ${entityLabel}`;
				res.responses = {
					200: {
						description: `Updated ${entityName}`,
						content: {
							"application/json": {
								schema: { type: "string" } // TODO: get type of primary key
							}
						}
					}
				};
				break;
			}
			case "find": {
				schema.settings.openapi.components.schemas[pluralizedEntityName] = {
					type: "array",
					items: {
						$ref: `#/components/schemas/${entityName}`
					}
				};

				if (!res.summary) res.summary = `Find ${pluralizedLabel}`;
				res.responses = {
					200: {
						description: `Found ${pluralizedLabel}`,
						content: {
							"application/json": {
								schema: {
									$ref: `#/components/schemas/${pluralizedEntityName}`
								}
							}
						}
					}
				};
				break;
			}
			case "list": {
				const listTypeName = `${entityName}List`;
				schema.settings.openapi.components.schemas[listTypeName] = {
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

				if (!res.summary) res.summary = `List ${pluralizedLabel} (with pagination)`;
				res.responses = {
					200: {
						description: `Found ${pluralizedLabel}`,
						content: {
							"application/json": {
								schema: {
									$ref: `#/components/schemas/${listTypeName}`
								}
							}
						}
					}
				};
				break;
			}
			case "count": {
				if (!res.summary) res.summary = `Count ${pluralizedLabel}`;
				res.responses = {
					200: {
						description: `Number of ${pluralizedLabel}`,
						content: {
							"application/json": {
								schema: {
									type: "number"
								}
							}
						}
					}
				};
				break;
			}
			case "get": {
				if (!res.summary) res.summary = `Get a ${entityLabel} by ID`;
				res.responses = {
					200: {
						description: `Found ${entityLabel}`,
						content: {
							"application/json": {
								schema: {
									$ref: `#/components/schemas/${entityName}`
								}
							}
						}
					}
				};
				break;
			}
		}
	}

	return res;
}

function generateOpenAPISchema(name, schema) {
	const entityName = capitalize(pluralize(name, 1));
	const pluralizedEntityName = pluralize(entityName);

	if (!schema.settings) return;
	if (!schema.settings.rest) return;
	//if (!schema.settings.fields) return;
	if (!schema.actions) return;

	const isDatabaseService = !!(
		schema.metadata &&
		schema.metadata.$package &&
		schema.metadata.$package.name == "@moleculer/database"
	);
	const serviceFullName = Service.getVersionedFullName(schema.name, schema.version);

	const basePath =
		schema.settings.rest === true
			? "/" + serviceFullName.replace(/\./, "/")
			: schema.settings.rest;

	const tagName = uncapitalize(pluralizedEntityName);
	schema.settings.openapi = _.defaultsDeep(schema.settings.openapi, {
		components: { schemas: {} },
		tags: [
			{
				name: tagName,
				description: `${pluralizedEntityName} operations`
			}
		]
	});

	// Generate common entity schema
    if (isDatabaseService) {
        generateEntityType(
            schema.settings.openapi.components.schemas,
            entityName,
            schema.settings.fields
        );
    }

	Object.keys(schema.actions).forEach(actionName => {
		const actionDef = schema.actions[actionName];
		const visibility = actionDef.visibility || "published";
		const actionFullName = `${serviceFullName}.${actionDef.name || actionName}`;
		if (actionDef.rest && visibility == "published" && actionDef.params) {
			actionDef.openapi = _.defaultsDeep(
				actionDef.openapi,
				generateActionOpenAPISchema(actionDef, {
					schema,
					basePath,
					entityName,
					actionName,
					actionFullName,
					tagName,
					isDatabaseService
				})
			);
		}
	});
}

module.exports = {
	generateOpenAPISchema
};
