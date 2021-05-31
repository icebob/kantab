"use strict";

module.exports = {
	name: "FindEntity",

	// Wrap local action handlers
	localAction(handler, action) {
		// If this feature enabled
		if (action.needEntity) {
			return async function FindEntityMiddleware(ctx) {
				const svc = ctx.service;
				if (action.defaultScopes && ctx.params.scope == null) {
					ctx.params.scope = action.defaultScopes;
				}
				ctx.locals.entity = await svc.resolveEntities(ctx, ctx.params, {
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
