"use strict";

const passport = require("passport");

const providerName = "facebook";

module.exports = {
	name: providerName,

	register(setting, route) {
		let Strategy;
		try {
			Strategy = require("passport-facebook").Strategy;
		}
		catch (error) {
			this.logger.error("The 'passport-facebook' package is missing. Please install it with 'npm i passport-facebook' command.");
			return;
		}		

		passport.use(providerName, new Strategy(Object.assign({
			clientID: process.env.FACEBOOK_CLIENT_ID,
			clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
			callbackURL: `/auth/${providerName}/callback`,
			profileFields: ["name", "email", "link", "locale", "timezone"],
		}, setting), (accessToken, refreshToken, profile, done) => {
			this.logger.debug(`Received '${providerName}' social profile: `, profile);

			this.signInSocialUser(this.processFacebookProfile(profile), done);
		}));

		// Create route aliases
		route.aliases[`GET /${providerName}`] = (req, res) => passport.authenticate(providerName, { scope: setting.scope || ["email", "user_location"] })(req, res);
		route.aliases[`GET /${providerName}/callback`] = (req, res) => this.socialAuthCallback(providerName, req, res);
	},

	processProfile(profile) {
		const res = {
			provider: profile.provider,
			socialID: profile.id,
			name: profile.name.givenName + " " + profile.name.familyName,
			email: profile._json.email,
			avatar: `https://graph.facebook.com/${profile.id}/picture?type=large`
		};

		return res;
	}
};
