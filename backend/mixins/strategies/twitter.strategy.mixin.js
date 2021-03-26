"use strict";

const passport = require("passport");

const providerName = "twitter";

/**
 * Old OAuth v1 authentication doesn't support sessionless authentication.
 *
 * Handle keys: https://apps.twitter.com/app/new
 */
module.exports = {
	methods: {
		registerTwitterStrategy(setting, route) {
			let Strategy;
			try {
				Strategy = require("passport-twitter").Strategy;
			} catch (error) {
				this.logger.error(
					"The 'passport-twitter' package is missing. Please install it with 'npm i passport-twitter' command."
				);
				return;
			}

			passport.use(
				providerName,
				new Strategy(
					Object.assign(
						{
							consumerKey: process.env.TWITTER_CLIENT_ID,
							consumerSecret: process.env.TWITTER_CLIENT_SECRET,
							callbackURL: `/auth/${providerName}/callback`,
							includeEmail: true
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
								profile: this.processTwitterProfile(profile)
							},
							done
						);
					}
				)
			);

			// Create route aliases
			const callback = this.socialAuthCallback(setting, providerName);

			route.aliases[`GET /${providerName}`] = (req, res) =>
				passport.authenticate(providerName, {})(req, res, callback(req, res));
			route.aliases[`GET /${providerName}/callback`] = (req, res) =>
				passport.authenticate(providerName)(req, res, callback(req, res));
		},

		processTwitterProfile(profile) {
			const res = {
				provider: profile.provider,
				socialID: profile.id,
				username: profile.username,
				fullName: profile.displayName,
				email: `${profile.username}@twitter.com`,
				avatar: profile._json.profile_image_url_https
			};

			return res;
		}
	}
};
