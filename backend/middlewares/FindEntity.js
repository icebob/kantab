"use strict";

const { MoleculerClientError } = require("moleculer").Errors;

module.exports = {

	// Wrap local action handlers
	localAction(handler, action) {
		// If this feature enabled
		if (action.needEntity) {
			return async function FindEntityMiddleware(ctx) {
				const entity = await this.adapter.findOne({ _id: ctx.params.id });
				if (!entity)
					throw new MoleculerClientError("Entity not found!", 400, "ERR_ENTITY_NOT_FOUND");

				ctx.entity = entity;

				// Call the handler
				return handler(ctx);

			}.bind(this);
		}

		// Return original handler, because feature is disabled
		return handler;
	}

};
