"use strict";

const ApiGateway 		= require("moleculer-web");
const _ 				= require("lodash");
const helmet 			= require("helmet");
const cookie 			= require("cookie");
const C 				= require("../constants");

const PassportMixin 	= require("../mixins/passport.mixin");
const I18NextMixin 		= require("../mixins/i18next.mixin");
const GraphQLMixin 		= require("../mixins/graphql.mixin");
const OpenApiMixin 		= require("../mixins/openapi.mixin");

const { GraphQLError } 				= require("graphql");
const Kind							= require("graphql/language").Kind;

const depthLimit 					= require("graphql-depth-limit");
const { createComplexityLimitRule } = require("graphql-validation-complexity");

/**
 * Initialize Webpack middleware in development
 */
function initWebpackMiddlewares() {
	if (process.env.NODE_ENV == "production")
		return [];

	const webpack	 		= require("webpack");
	const devMiddleware 	= require("webpack-dev-middleware");
	const hotMiddleware 	= require("webpack-hot-middleware");
	const config 			= _.cloneDeep(require("@vue/cli-service/webpack.config.js"));

	config.entry.app.unshift("webpack-hot-middleware/client");
	//require("fs").writeFileSync("./webpack.generated.config.js", JSON.stringify(config, null, 4), "utf8");
	const compiler 			= webpack(config);


	return [
		// Webpack middleware
		devMiddleware(compiler, {
			noInfo: true,
			publicPath: config.output.publicPath,
			headers: { "Access-Control-Allow-Origin": "*" },
			stats: { colors: true }
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

	mixins: [
		// Gateway
		ApiGateway,

		// Passport
		PassportMixin({
			routePath: "/auth",
			localAuthAlias: "v1.accounts.login",
			successRedirect: "/",
			providers: {
				google: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
				facebook: process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET,
				github: process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
				twitter: false
			}
		}),

		// I18N
		I18NextMixin(),

		// GraphQL
		GraphQLMixin({

			typeDefs: `
				scalar Date
			`,

			resolvers: {
				Date: {
					__parseValue(value) {
						return new Date(value); // value from the client
					},
					__serialize(value) {
						return value.getTime(); // value sent to the client
					},
					__parseLiteral(ast) {
						if (ast.kind === Kind.INT)
							return parseInt(ast.value, 10); // ast value is always in string format

						return null;
					}
				}
			},

			routeOptions: {
				authentication: true,
				cors: true,
			},

			// https://www.apollographql.com/docs/apollo-server/v2/api/apollo-server.html
			serverOptions: {
				tracing: true,
				introspection: true,

				engine: {
					apiKey: process.env.APOLLO_ENGINE_KEY
				},

				validationRules: [
					depthLimit(10),
					createComplexityLimitRule(1000, {
						createError(cost, documentNode) {
							const error = new GraphQLError("custom error", [documentNode]);
							error.meta = { cost };
							return error;
						}
					})
				]
			}
		}),

		OpenApiMixin()
	],

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

				authentication: true,
				//authorization: true,

				aliases: {
					"REST /v1/boards": "v1.boards"
				},

				// Disable to call not-mapped actions
				//mappingPolicy: "restrict",

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
					ApiGateway.serveStatic("./static"),
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
		 * Authenticate from request
		 *
		 * @param {Context} ctx
		 * @param {Object} route
		 * @param {IncomingRequest} req
		 * @returns {Promise}
		 */
		async authenticate(ctx, route, req) {
			let token;

			// Get JWT token from cookie
			if (req.headers.cookie) {
				const cookies = cookie.parse(req.headers.cookie);
				token = cookies["jwt-token"];
			}

			// Get JWT token from Authorization header
			if (!token) {
				const auth = req.headers["authorization"];
				if (auth && auth.startsWith("Bearer "))
					token = auth.slice(7);
			}

			ctx.meta.roles = [C.ROLE_EVERYONE];

			if (token) {
				// Verify JWT token
				const user = await ctx.call("v1.accounts.resolveToken", { token });
				if (user) {
					this.logger.info("User authenticated via JWT.", { username: user.username, email: user.email, id: user.id });

					ctx.meta.roles.push(C.ROLE_AUTHENTICATED);
					if (Array.isArray(user.roles))
						ctx.meta.roles.push(...user.roles);
					ctx.meta.token = token;
					ctx.meta.userID = user.id;
					// Reduce user fields (it will be transferred to other nodes)
					return _.pick(user, ["id", "email", "username", "firstName", "lastName", "avatar"]);
				}
				return null;
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
