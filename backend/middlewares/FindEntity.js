"use strict";

const { MoleculerClientError } = require("moleculer").Errors;
const C = require("../constants");

module.exports = {
	name: "FindEntity",

	// Wrap local action handlers
	localAction(handler, action) {
		// If this feature enabled
		if (action.needEntity) {
			return async function FindEntityMiddleware(ctx) {
				const svc = ctx.service;
				const entity = await svc.getById(ctx.params.id, true);
				if (!entity)
					throw new MoleculerClientError("Entity not found!", 400, "ERR_ENTITY_NOT_FOUND");

				ctx.locals.entity = entity;

				// Call the handler
				return handler(ctx);

			}.bind(this);
		}

		// Return original handler, because feature is disabled
		return handler;
	}

};
