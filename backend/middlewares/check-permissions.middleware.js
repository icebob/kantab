"use strict";

const _ = require("lodash");
const { MoleculerClientError } = require("moleculer").Errors;
const C = require("../constants");

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
					if (p == C.ROLE_AUTHENTICATED) {
						// Check if user is logged in
						return permFuncs.push(async ctx => {
							return !!ctx.meta.userID;
						});
					}

					if (p == C.ROLE_BOARD_OWNER) {
						// Check if user is owner of the board
						return permFuncs.push(async ctx => {
							if (_.isFunction(ctx.service.isBoardOwner))
								return ctx.service.isBoardOwner.call(this, ctx);
							return false;
						});
					}

					if (p == C.ROLE_BOARD_MEMBER) {
						// Check if user is member of the entity
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

				if (ctx.meta.$repl == true) res = true;
				if (ctx.meta.roles && ctx.meta.roles.includes(C.ROLE_ADMINISTRATOR)) res = true;
				if (permFuncs.length == 0) res = true;

				if (res !== true) {
					if (permFuncs.length > 0) {
						const results = await ctx.broker.Promise.all(
							permFuncs.map(async fn => fn.call(this, ctx))
						);
						res = results.some(r => !!r);
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
