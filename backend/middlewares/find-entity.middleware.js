"use strict";

const _ = require("lodash");

module.exports = {
	name: "FindEntity",

	// Wrap local action handlers
	localAction(handler, action) {
		// If this feature enabled
		if (action.needEntity) {
			return async function FindEntityMiddleware(ctx) {
				const svc = ctx.service;
				const params = { id: ctx.params.id };
				if (action.scopes) {
					params.scope = action.scopes;
				} else {
					params.scope = ctx.params.scope;
				}
				if (action.defaultPopulate) {
					params.populate = action.defaultPopulate;
				}
				ctx.locals.entity = await svc.resolveEntities(ctx, params, {
					throwIfNotExist: true
				});

				// Call the handler
				return handler(ctx);
			}.bind(this);
		}

		// Return original handler, because feature is disabled
		return handler;
	}
};
