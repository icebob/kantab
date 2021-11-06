"use strict";

const ApiGateway = require("moleculer-web");
const _ = require("lodash");
const helmet = require("helmet");
const history = require("connect-history-api-fallback");
const cookie = require("cookie");
const C = require("../constants");

const PassportMixin = require("../mixins/passport.mixin");
const I18NextMixin = require("../mixins/i18next.mixin");
const OpenApiMixin = require("../mixins/openapi.mixin");
const SocketIOMixin = require("moleculer-io");
const ApolloMixin = require("../mixins/apollo.mixin");

module.exports = {
	name: "api",

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
		ApolloMixin,

		// Swagger
		OpenApiMixin({
			schema: {
				info: {
					title: "KanTab REST API Documentation",
					version: "v1"
				}
			}
		}),

		// Socket.IO handler
		SocketIOMixin
	],

	metadata: {
		dockerCompose: {
			template: {
				labels: [
					"traefik.enable=true",
					"traefik.http.routers.api.entrypoints=http",
					"traefik.http.routers.api.rule=PathPrefix(`/`)",
					"traefik.http.services.api.loadbalancer.server.port=4000"
				]
			}
		}
	},

	// More info about settings: https://moleculer.services/docs/0.13/moleculer-web.html
	settings: {
		port: process.env.PORT || 4000,

		use: [
			helmet({
				// It needs that GraphQL Playground and OpenAPI UI work
				contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false
			})
		],

		routes: [
			/**
			 * API routes
			 */
			{
				path: "/api",

				whitelist: ["v1.accounts.**", "v1.boards.**", "maildev.**"],

				etag: true,

				camelCaseNames: true,

				authentication: true,
				//authorization: true,

				autoAliases: true,

				aliases: {},

				// Disable to call not-mapped actions
				//mappingPolicy: "restrict",

				// Use bodyparser modules
				bodyParsers: {
					json: { limit: "2MB" },
					urlencoded: { extended: true, limit: "2MB" }
				}
			},

			/**
			 * Static routes
			 */
			{
				path: "/",
				use: [history(), ApiGateway.serveStatic("public", {})],

				mappingPolicy: "restrict"
				//logging: false
			}
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

			// Get JWT token from Authorization header
			const auth = req.headers["authorization"];
			if (auth && auth.startsWith("Bearer ")) token = auth.slice(7);

			// Get JWT token from cookie
			if (!token && req.headers.cookie) {
				const cookies = cookie.parse(req.headers.cookie);
				token = cookies["jwt-token"];
			}

			ctx.meta.roles = [C.ROLE_EVERYONE];

			if (token) {
				// Verify JWT token
				const user = await ctx.call("v1.accounts.resolveToken", { token });
				if (user) {
					this.logger.debug("User authenticated via JWT.", {
						username: user.username,
						email: user.email,
						id: user.id
					});

					ctx.meta.roles.push(C.ROLE_AUTHENTICATED);
					if (Array.isArray(user.roles)) ctx.meta.roles.push(...user.roles);
					ctx.meta.token = token;
					ctx.meta.userID = user.id;
					// Reduce user fields (it will be transferred to other nodes)
					return _.pick(user, ["id", "email", "username", "fullName", "avatar"]);
				}
				return null;
			}

			//return this.Promise.reject(new UnAuthorizedError());
		},

		async signInSocialUser(params, cb) {
			try {
				cb(null, await this.broker.call("v1.accounts.socialLogin", params));
			} catch (err) {
				cb(err);
			}
		}
	}
};
