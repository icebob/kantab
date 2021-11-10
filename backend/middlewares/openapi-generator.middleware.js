"use strict";

const pluralize = require("pluralize");
const { generateOpenAPISchema } = require("../libs/openapi-generator");

module.exports = {
	name: "OpenAPI-Generator",

	serviceCreating(svc, schema) {
		const name = schema.name;
		if (!["boards", "lists", "accounts"].includes(name)) return;
		const entityName = pluralize(name, 1);
		generateOpenAPISchema(entityName, schema);
	}
};
