"use strict";

const _ 				= require("lodash");
const passport 			= require("passport");

function loadStrategy(name) {
	try {
		return require(name).Strategy;
	}
	catch (error) {
		this.logger.error(`The '${name}' package is missing. Please install it with 'npm install ${name}' command.`);
		return;
	}
}

module.exports = function(mixinOptions) {
	mixinOptions = mixinOptions || {};

	const strategyMethods = {};
	const strategies = require("./strategies");
	strategies.forEach(strategy => {
		strategyMethods[`register${_.capitalize(strategy.name)}Strategy`] = strategy.register;
		strategyMethods[`process${_.capitalize(strategy.name)}Profile`] = strategy.processProfile;
	});

	return {
		methods: {
			...strategyMethods,

			async signInSocialUser(params, cb) {
				try {
					cb(null, await this.broker.call(mixinOptions.loginAction || "users.login", params));
				} catch(err) {
					cb(err);
				}
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
