"use strict";

const ApiGateway 		= require("moleculer-web");
const PassportMixin 	= require("../mixins/passport.mixin");
const _ 				= require("lodash");
const helmet 			= require("helmet");
const cookie 			= require("cookie");

module.exports = {
	name: "api",
	version: 1,

	mixins: [ApiGateway, PassportMixin()],

	providers: {
		google: true,
		facebook: true,
		github: true,
		//twitter: true
	},

	// More info about settings: https://moleculer.services/docs/0.13/moleculer-web.html
	settings: {
		port: process.env.PORT || 4000,

		use: [
			helmet()
		],

		routes: [{
			path: "/api",
			whitelist: [
				// Access to any actions in all services under "/api" URL
				"**"
			],
			camelCaseNames: true,
			authorization: true,
		}],

		// Serve assets from "public" folder
		assets: {
			folder: "public"
		}
	},

	methods: {
		/**
		 * Authorize the request
		 *
		 * @param {Context} ctx
		 * @param {Object} route
		 * @param {IncomingRequest} req
		 * @returns {Promise}
		 */
		async authorize(ctx, route, req) {
			let token;
			if (req.headers.cookie) {
				const cookies = cookie.parse(req.headers.cookie);
				token = cookies["jwt-token"];
			}

			if (token) {
				// Verify JWT token
				let user = await ctx.call("v1.accounts.resolveToken", { token });
				if (user) {
					this.logger.info("Authenticated via JWT: ", user.username);
					// Reduce user fields (it will be transferred to other nodes)
					ctx.meta.user = _.pick(user, ["_id", "email", "username", "firstName", "lastName", "avatar"]);
					ctx.meta.token = token;
				}
				return user;
			}

			//return this.Promise.reject(new UnAuthorizedError());
		},
	}
};
