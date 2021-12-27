"use strict";

const pluralize = require("pluralize");
const { generateCRUDGraphQL } = require("../libs/graphql-generator");

module.exports = {
	name: "GraphQL-Generator",

	serviceCreating(svc, schema) {
		const name = schema.name;
		if (!["accounts", "boards", "lists", "cards"].includes(name)) return;
		const entityName = pluralize(name, 1);
		generateCRUDGraphQL(entityName, schema);
	}
};
