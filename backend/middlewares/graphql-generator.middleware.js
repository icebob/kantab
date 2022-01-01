"use strict";

const pluralize = require("pluralize");
const { generateCRUDGraphQL } = require("../libs/graphql-generator");

module.exports = {
	name: "GraphQL-Generator",

	serviceCreating(svc, schema) {
		if (
			!schema.settings ||
			!schema.settings.graphql ||
			!["accounts", "boards", "lists", "cards"].includes(schema.name)
		)
			return;

		let name = schema.settings.graphql.entityName || schema.name;
		const entityName = pluralize(name, 1);
		generateCRUDGraphQL(entityName, schema);
	}
};
