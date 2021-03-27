"use strict";

const passport = require("passport");

const providerName = "facebook";

/**
 * Handle keys: https://developers.facebook.com/apps/
 */
module.exports = {
	methods: {
		registerFacebookStrategy(setting, route) {
			let Strategy;
			try {
				Strategy = require("passport-facebook").Strategy;
			} catch (error) {
				this.logger.error(
					"The 'passport-facebook' package is missing. Please install it with 'npm i passport-facebook' command."
				);
				return;
			}

			setting = Object.assign(
				{},
				{
					scope: ["email", "user_location"]
				},
				setting
			);

			passport.use(
				providerName,
				new Strategy(
					Object.assign(
						{
							clientID: process.env.FACEBOOK_CLIENT_ID,
							clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
							callbackURL: `/auth/${providerName}/callback`,
							profileFields: [
								"first_name",
								"last_name",
								"email",
								"link",
								"locale",
								"timezone"
							]
						},
						setting
					),
					(accessToken, refreshToken, profile, done) => {
						this.logger.info(`Received '${providerName}' social profile: `, profile);

						this.signInSocialUser(
							{
								provider: providerName,
								accessToken,
								refreshToken,
								profile: this.processFacebookProfile(profile)
							},
							done
						);
					}
				)
			);

			// Create route aliases
			const callback = this.socialAuthCallback(setting, providerName);

			route.aliases[`GET /${providerName}`] = (req, res) =>
				passport.authenticate(providerName, { scope: setting.scope })(
					req,
					res,
					callback(req, res)
				);
			route.aliases[`GET /${providerName}/callback`] = (req, res) =>
				passport.authenticate(providerName, { session: false })(
					req,
					res,
					callback(req, res)
				);
		},

		processFacebookProfile(profile) {
			const res = {
				provider: profile.provider,
				socialID: profile.id,
				fullName: profile.name.givenName + " " + profile.name.familyName,
				email: profile._json.email,
				avatar: `https://graph.facebook.com/${profile.id}/picture?type=large`
			};

			return res;
		}
	}
};
