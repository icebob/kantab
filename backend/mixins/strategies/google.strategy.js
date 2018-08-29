"use strict";

const passport = require("passport");

const providerName = "google";

module.exports = {
	name: providerName,

	register(setting, route) {
		let Strategy;
		try {
			Strategy = require("passport-google-oauth20").Strategy;
		}
		catch (error) {
			this.logger.error("The 'passport-google-oauth20' package is missing. Please install it with 'npm i passport-google-oauth20' command.");
			return;
		}

		passport.use(providerName, new Strategy(Object.assign({
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: `/auth/${providerName}/callback`
		}, setting), (accessToken, refreshToken, profile, done) => {
			this.logger.debug(`Received '${providerName}' social profile: `, profile);

			this.signInSocialUser({ provider: providerName, accessToken, refreshToken, profile: this.processGoogleProfile(profile) }, done);
		}));

		// Create route aliases
		route.aliases[`GET /${providerName}`] = (req, res) => passport.authenticate(providerName, { scope: setting.scope || "profile email" })(req, res);
		route.aliases[`GET /${providerName}/callback`] = (req, res) => this.socialAuthCallback(req, res, setting, providerName);
	},

	processProfile(profile) {
		const res = {
			provider: profile.provider,
			socialID: profile.id,
			firstName: profile.name.givenName,
			lastName: profile.name.familyName,
		};
		if (profile.emails && profile.emails.length > 0)
			res.email = profile.emails[0].value;

		if (profile.photos && profile.photos.length > 0)
			res.avatar = profile.photos[0].value.replace("sz=50", "sz=200");

		return res;
	}
};
