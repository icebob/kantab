"use strict";

const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const passport = require("passport");
const cookie = require("cookie");

module.exports = function (mixinOptions) {
	if (!mixinOptions || !mixinOptions.providers)
		throw new Error("Missing 'providers' property in service mixin options");

	const strategyMixins = [];

	const Providers = [];

	_.forIn(mixinOptions.providers, (setting, name) => {
		if (!setting) return;

		const filename = path.resolve(__dirname, "strategies", `${name}.strategy.mixin.js`);
		if (fs.existsSync(filename)) {
			const strategy = require(filename);
			strategyMixins.push(strategy);
			Providers.push({ name, setting: _.isObject(setting) ? setting : {} });
		}
	});

	return {
		mixins: strategyMixins,

		actions: {
			/**
			 * Return the supported Social Auth providers
			 */
			supportedSocialAuthProviders: {
				graphql: {
					query: "supportedSocialAuthProviders: [String]"
				},
				handler() {
					return Providers.map(o => o.name);
				}
			}
		},

		methods: {
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
						res.setHeader(
							"Set-Cookie",
							cookie.serialize(
								mixinOptions.cookieName || "jwt-token",
								req.user.token,
								Object.assign(
									{
										//httpOnly: true,
										path: "/",
										maxAge: 60 * 60 * 24 * 90 // 90 days
									},
									mixinOptions.cookieOptions || {}
								)
							)
						);
					}

					this.logger.info(`Successful authentication with '${providerName}'.`);
					this.logger.info("User", req.user);
					this.sendRedirect(res, mixinOptions.successRedirect || "/", 302);
				};
			}
		},

		created() {
			const route = {
				path: mixinOptions.routePath || "/auth",

				use: [passport.initialize()],

				aliases: {},

				mappingPolicy: "restrict",

				bodyParsers: {
					json: true,
					urlencoded: { extended: true }
				}
			};

			if (mixinOptions.localAuthAlias)
				route.aliases["POST /local"] = mixinOptions.localAuthAlias;

			Providers.forEach(provider => {
				const fnName = `register${_.capitalize(provider.name)}Strategy`;

				if (_.isFunction(this[fnName])) {
					this[fnName](provider.setting, route);
				} else {
					throw new Error(`Missing Passport strategy mixin for '${provider.name}'`);
				}
			});

			route.aliases[
				"GET /supported-social-auth-providers"
			] = `${this.fullName}.supportedSocialAuthProviders`;

			// Add `/auth` route.
			this.settings.routes.unshift(route);
		}
	};
};
