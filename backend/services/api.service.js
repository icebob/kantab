"use strict";

const ApiGateway 		= require("moleculer-web");
const _ 				= require("lodash");
const path 				= require("path");
const helmet 			= require("helmet");
const cookie 			= require("cookie");
const C 				= require("../constants");

const i18next 			= require("i18next");
const i18nextFs 		= require("i18next-node-fs-backend");

const PassportMixin 	= require("../mixins/passport.mixin");

function setPath(object, path, newValue) {
	let stack;
	if (typeof path !== "string") stack = [].concat(path);
	if (typeof path === "string") stack = path.split(".");

	while(stack.length > 1) {
		let key = stack.shift();
		if (key.indexOf("###") > -1) key = key.replace(/###/g, ".");
		if (!object[key]) object[key] = {};
		object = object[key];
	}

	let key = stack.shift();
	if (key.indexOf("###") > -1) key = key.replace(/###/g, ".");
	object[key] = newValue;
}

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
			stats: {colors: true}
		}),

		// Webpack hot replacement
		hotMiddleware(compiler, {
			log: console.info
		})
	];
}

i18next
	.use(i18nextFs)
	.init({
		//debug: true,
		fallbackLng: "en",
		whitelist: ["en", "hu"],
		ns: ["common", "errors"],
		defaultNS: "common",
		load: "all",
		saveMissing: true, //config.isDevMode(),
		saveMissingTo: "all", // "fallback", "current", "all"

		backend: {
			// path where resources get loaded from
			loadPath: path.join(".", "locales", "{{lng}}", "{{ns}}.json"),

			// path to post missing resources
			addPath: path.join(".", "locales", "{{lng}}", "{{ns}}.missing.json"),

			// jsonIndent to use when storing json files
			jsonIndent: 4
		}
	}, function(err, t) {
		if (err)
			console.warn(err);
	});

module.exports = {
	name: "api",
	version: 1,

	mixins: [ApiGateway, PassportMixin({
		routePath: "/auth",
		localAuthAlias: "v1.accounts.login",
		successRedirect: "/",
		providers: {
			google: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
			facebook: process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET,
			github: process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
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
			 * I18Next routes
			 */
			{
				path: "/locales",

				aliases: {
					// multiload backend route
					"GET /": (req, res) => {
						let resources = {};

						let languages = req.query["lng"] ? req.query["lng"].split(" ") : [];
						let namespaces = req.query["ns"] ? req.query["ns"].split(" ") : [];

						// extend ns
						namespaces.forEach(ns => {
							if (i18next.options.ns && i18next.options.ns.indexOf(ns) < 0) i18next.options.ns.push(ns);
						});

						i18next.services.backendConnector.load(languages, namespaces, function() {
							languages.forEach(lng => namespaces.forEach(ns => setPath(resources, [lng, ns], i18next.getResourceBundle(lng, ns))));

							res.setHeader("Content-Type", "application/json; charset=utf-8");
							res.end(JSON.stringify(resources));
						});
					},

					// missing keys
					"POST /": (req, res) => {
						let lng = req.query["lng"];
						let ns = req.query["ns"];

						for (let m in req.body) {
							if (m != "_t")
								i18next.services.backendConnector.saveMissing([lng], ns, m, req.body[m]);
						}
						res.end("ok");
					},
				},

				bodyParsers: {
					urlencoded: true
				},

				mappingPolicy: "restrict",
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
