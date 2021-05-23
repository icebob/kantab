"use strict";

const _ = require("lodash");
const { MoleculerClientError } = require("moleculer").Errors;

module.exports = {
	name: "CheckPermissions",

	// Wrap local action handlers
	localAction(handler, action) {
		// If this feature enabled
		if (action.permissions) {
			const permissions = Array.isArray(action.permissions)
				? action.permissions
				: [action.permissions];

			const permNames = [];
			const permFuncs = [];
			permissions.forEach(p => {
				if (_.isFunction(p)) {
					// Add custom permission function
					return permFuncs.push(p);
				}

				if (_.isString(p)) {
					if (p == "$owner") {
						// Check if user is owner of the entity
						return permFuncs.push(async ctx => {
							if (_.isFunction(ctx.service.isEntityOwner))
								return ctx.service.isEntityOwner.call(this, ctx);
							return false;
						});
					}

					if (p == "$member") {
						// Check if user is owner of the entity
						return permFuncs.push(async ctx => {
							if (_.isFunction(ctx.service.isBoardMember))
								return ctx.service.isBoardMember.call(this, ctx);
							return false;
						});
					}

					// Add role or permission name
					permNames.push(p);
				}
			});

			return async function CheckPermissionsMiddleware(ctx) {
				let res = false;
				const roles = ctx.meta.roles;
				if (ctx.meta.$repl) res = true;

				if (!res && roles) {
					if (permNames.length > 0) {
						res = await ctx.call("v1.acl.hasAccess", { roles, permissions: permNames });
					}
				}
				if (res !== true) {
					if (permFuncs.length > 0) {
						const results = await ctx.broker.Promise.all(
							permFuncs.map(async fn => fn.call(this, ctx))
						);
						res = results.find(r => !!r);
					}

					if (res !== true)
						throw new MoleculerClientError(
							"You have no right for this operation!",
							401,
							"ERR_HAS_NO_ACCESS",
							{ action: action.name }
						);
				}

				// Call the handler
				return handler(ctx);
			}.bind(this);
		}

		// Return original handler, because feature is disabled
		return handler;
	}
};
