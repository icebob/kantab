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

	return {
		methods: {
			registerGoogleStrategy(setting, route) {
				const GoogleStrategy = loadStrategy("passport-google-oauth20");
				if (!GoogleStrategy) return;

				passport.use("google", new GoogleStrategy(Object.assign({
					clientID: process.env.GOOGLE_CLIENT_ID,
					clientSecret: process.env.GOOGLE_CLIENT_SECRET,
					callbackURL: "/auth/google/callback"
				}, setting), (accessToken, refreshToken, profile, done) => {
					this.logger.debug(`Received '${profile.provider}' profile: `, profile);

					this.signInSocialUser(this.processGoogleProfile(profile), done);
				}));

				// Create route aliases
				route.aliases["GET /google"] = (req, res) => passport.authenticate("google", { scope: setting.scope || "profile email" })(req, res);
				route.aliases["GET /google/callback"] = (req, res) => this.socialAuthCallback("google", req, res);
			},

			processGoogleProfile(profile) {
				const res = {
					provider: profile.provider,
					socialID: profile.id,
					name: profile.displayName,
				};
				if (profile.emails && profile.emails.length > 0)
					res.email = profile.emails[0].value;

				if (profile.photos && profile.photos.length > 0)
					res.avatar = profile.photos[0].value.replace("sz=50", "sz=200");

				return res;
			},

			// TODO: extract to `strategies/facebook.strategy.js` files and load them to methods
			registerFacebookStrategy(setting, route) {
				const FacebookStrategy = loadStrategy("passport-facebook");
				if (!FacebookStrategy) return;

				passport.use("facebook", new FacebookStrategy(Object.assign({
					clientID: process.env.FACEBOOK_CLIENT_ID,
					clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
					callbackURL: "/auth/facebook/callback",
					profileFields: ["name", "email", "link", "locale", "timezone"],
				}, setting), (accessToken, refreshToken, profile, done) => {
					this.logger.debug(`Received '${profile.provider}' profile: `, profile);

					this.signInSocialUser(this.processFacebookProfile(profile), done);
				}));

				// Create route aliases
				route.aliases["GET /facebook"] = (req, res) => passport.authenticate("facebook", { scope: setting.scope || ["email", "user_location"] })(req, res);
				route.aliases["GET /facebook/callback"] = (req, res) => this.socialAuthCallback("facebook", req, res);
			},

			processFacebookProfile(profile) {
				const res = {
					provider: profile.provider,
					socialID: profile.id,
					name: profile.name.givenName + " " + profile.name.familyName,
					email: profile._json.email,
					avatar: `https://graph.facebook.com/${profile.id}/picture?type=large`
				};

				return res;
			},

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
