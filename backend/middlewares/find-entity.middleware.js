"use strict";

module.exports = {
	name: "FindEntity",

	// Wrap local action handlers
	localAction(handler, action) {
		// If this feature enabled
		if (action.needEntity) {
			return async function FindEntityMiddleware(ctx) {
				const svc = ctx.service;
				ctx.locals.entity = await svc.resolveEntities(ctx, ctx.params, {
					throwOnError: true
				});

				// Call the handler
				return handler(ctx);
			}.bind(this);
		}

		// Return original handler, because feature is disabled
		return handler;
	}
};
