"use strict";

const pluralize = require("pluralize");
const { generateCRUDGraphQL } = require("../libs/graphql-generator");

module.exports = {
	name: "GraphQL-Generator",

	serviceCreating(svc, schema) {
		const name = schema.name;
		if (!["boards", "lists"].includes(name)) return;
		const entityName = pluralize(name, 1);
		generateCRUDGraphQL(entityName, schema);
	}
};
