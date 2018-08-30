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
				try {
					cb(null, await this.broker.call("v1.accounts.socialLogin", params));
				} catch(err) {
					cb(err);
				}
			},

			socialAuthCallback(setting, providerName) {
				return (req, res) => err => {
					if (err) {
						/*
						if (err.type == "MAGIC_LINK_SENT") {
							// Passwordless login
							req.flash("info", err.message);
							return this.sendRedirect(res, "/login");
						}
						req.flash("error", err.message);
						if (req.user)
							// Linking error
							return this.sendRedirect(res, "/");
						else
							return this.sendRedirect(res, "/login");
						*/
						this.logger.warn("Authentication error.", err);
						this.sendError(req, res, err);
						return;
					}

					res.setHeader("Set-Cookie", cookie.serialize("jwt-token", req.user.token, {
						httpOnly: true,
						path: "/",
						maxAge: 60 * 60 * 24 * 90 // 90 days
					}));

					this.logger.info(`Successful authentication with '${providerName}'.`);
					this.logger.info("User", req.user);
					this.sendRedirect(res, "/", 302);
				};
			}
		},

		created() {
			if (!this.schema.providers)
				throw new Error("Missing 'providers' property in service schema");

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

			_.forIn(this.schema.providers, (setting, provider) => {
				const fnName = `register${_.capitalize(provider)}Strategy`;
				if (!_.isObject(setting))
					setting = {};

				if (_.isFunction(this[fnName])) {
					this[fnName](setting, route);
				} else {
					throw new Error(`Missing registered Passport strategy for '${provider}'`);
				}
			});

			// Add `/auth` route.
			this.settings.routes.unshift(route);
		}
	};
};
