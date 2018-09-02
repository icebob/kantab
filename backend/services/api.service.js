"use strict";

const ApiGateway 		= require("moleculer-web");
const _ 				= require("lodash");
const helmet 			= require("helmet");
const cookie 			= require("cookie");

const PassportMixin 	= require("../mixins/passport.mixin");

/**
 * Initialize Webpack middleware in development
 */
function initWebpackMiddlewares() {
	if (process.env.NODE_ENV == "production")
		return [];

	const webpack	 		= require("webpack");
	const devMiddleware 	= require("webpack-dev-middleware");
	const hotMiddleware 	= require("webpack-hot-middleware");
	const config 			= require("@vue/cli-service/webpack.config.js");

	config.entry.app.unshift("webpack-hot-middleware/client");
	require("fs").writeFileSync("./webpack.generated.config.js", JSON.stringify(config, null, 4), "utf8");
	const compiler 			= webpack(config);


	return [
		// Webpack middleware
		devMiddleware(compiler, {
			noInfo: true,
			publicPath: config.output.publicPath,
			headers: { "Access-Control-Allow-Origin": "*" },
			stats: {colors: true}
		}),

		// Webpack hot replacement
		hotMiddleware(compiler, {
			log: console.info
		})
	];
}

module.exports = {
	name: "api",
	version: 1,

	mixins: [ApiGateway, PassportMixin({
		routePath: "/auth",
		successRedirect: "/",
		providers: {
			google: true,
			facebook: true,
			github: true,
			twitter: false
		}
	})],

	// More info about settings: https://moleculer.services/docs/0.13/moleculer-web.html
	settings: {
		port: process.env.PORT || 4000,

		use: [
			helmet()
		],

		routes: [
			/**
			 * API routes
			 */
			{
				path: "/api",

				whitelist: [
				// Access to any actions in all services under "/api" URL
					"**"
				],

				camelCaseNames: true,

				authorization: true,

				aliases: {
				},

				// Disable to call not-mapped actions
				mappingPolicy: "restrict",

				// Use bodyparser modules
				bodyParsers: {
					json: { limit: "2MB" },
					urlencoded: { extended: true, limit: "2MB" }
				},
			},
			/**
			 * Static routes
			 */
			{
				path: "/",

				use: [
					// handle fallback for HTML5 history API
					require("connect-history-api-fallback")(),

					// Webpack middlewares
					...initWebpackMiddlewares(),

					// Serve static
					ApiGateway.serveStatic("./public"),
				],

				// Action aliases
				aliases: {
				},

				mappingPolicy: "restrict",
			},
		]
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

		async signInSocialUser(params, cb) {
			try {
				cb(null, await this.broker.call("v1.accounts.socialLogin", params));
			} catch(err) {
				cb(err);
			}
		},
	}
};
