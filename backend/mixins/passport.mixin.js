"use strict";

const _ 		= require("lodash");
const passport 	= require("passport");
const cookie    = require("cookie");

module.exports = function(mixinOptions) {
	mixinOptions = mixinOptions || {};

	const strategyMethods = {};
	const strategies = require("./strategies")();
	strategies.forEach(strategy => {
		strategyMethods[`register${_.capitalize(strategy.name)}Strategy`] = strategy.register;
		strategyMethods[`process${_.capitalize(strategy.name)}Profile`] = strategy.processProfile;
	});

	return {
		methods: {
			...strategyMethods,

			async signInSocialUser(params, cb) {
				const msg = `Missing 'signInSocialUser' method implementation in the '${this.name}' service.`;
				this.logger.warn(msg);
				cb(new Error(msg));
			},

			socialAuthCallback(setting, providerName) {
				return (req, res) => err => {
					if (err) {
						this.logger.warn("Authentication error.", err);
						this.sendError(req, res, err);
						return;
					}

					if (mixinOptions.cookieName !== false) {
						res.setHeader("Set-Cookie", cookie.serialize(mixinOptions.cookieName || "jwt-token", req.user.token, Object.assign({
							//httpOnly: true,
							path: "/",
							maxAge: 60 * 60 * 24 * 90 // 90 days
						}, mixinOptions.cookieOptions || {})));
					}

					this.logger.info(`Successful authentication with '${providerName}'.`);
					this.logger.info("User", req.user);
					this.sendRedirect(res, mixinOptions.successRedirect || "/", 302);
				};
			}
		},

		created() {
			if (!mixinOptions.providers)
				throw new Error("Missing 'providers' property in service mixin options");

			const route = {
				path: mixinOptions.routePath || "/auth",

				use: [
					passport.initialize(),
				],

				aliases: {},

				mappingPolicy: "restrict",

				bodyParsers: {
					json: true,
					urlencoded: { extended: true }
				},
			};

			if (mixinOptions.localAuthAlias)
				route.aliases["POST /local"] = mixinOptions.localAuthAlias;

			_.forIn(mixinOptions.providers, (setting, provider) => {
				if (setting === false) return;

				const fnName = `register${_.capitalize(provider)}Strategy`;
				if (!_.isObject(setting))
					setting = {};

				if (_.isFunction(this[fnName])) {
					this[fnName](setting, route);
				} else {
					throw new Error(`Missing Passport strategy for '${provider}'`);
				}
			});

			// Add `/auth` route.
			this.settings.routes.unshift(route);
		}
	};
};
