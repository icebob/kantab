"use strict";

const _ = require("lodash");
const { MoleculerClientError } = require("moleculer").Errors;

module.exports = {

	// Wrap local action handlers
	localAction(handler, action) {
		// If this feature enabled
		if (action.permissions) {
			const permissions = Array.isArray(action.permissions) ? action.permissions : [action.permissions];

			const permNames = permissions.filter(p => _.isString(p));
			const permFuncs = permissions.filter(p => _.isFunction(p));

			return async function CheckPermissionsMiddleware(ctx) {
				const roles = ctx.meta.roles;
				if (roles) {
					let res = await ctx.call("v1.acl.hasAccess", { roles, permissions: permNames });
					if (res !== true) {
						if (permFuncs.length > 0)
							res = await ctx.broker.Promise.some(permFuncs.map(async fn => fn.call(this, ctx)), 1);

						if (res !== true)
							throw new MoleculerClientError("You have no right for this operation!", 401, "ERR_HAS_NO_ACCESS", { action: action.name });
					}
				}

				// Call the handler
				return handler(ctx);

			}.bind(this);
		}

		// Return original handler, because feature is disabled
		return handler;
	}

};
