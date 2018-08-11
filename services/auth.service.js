"use strict";

//const util = require("util");
const jwt = require("jsonwebtoken");
const { MoleculerRetryableError, MoleculerClientError } = require("moleculer").Errors;

/**
 * auth service
 */
module.exports = {
	name: "auth",
	version: 1,

	/**
	 * Service settings
	 */
	settings: {
		/** Secret for JWT */
		JWT_SECRET: process.env.JWT_SECRET,
	},

	/**
	 * Service metadata
	 */
	metadata: {

	},

	/**
	 * Service dependencies
	 */
	//dependencies: [],

	/**
	 * Actions
	 */
	actions: {

		/**
		 * Get user by JWT token (for API GW authentication)
		 *
		 * @actions
		 * @param {String} token - JWT token
		 *
		 * @returns {Object} Resolved payload
		 */
		verifyToken: {
			cache: {
				keys: ["token"],
				ttl: 60 * 60 // 1 hour
			},
			params: {
				token: "string"
			},
			handler(ctx) {
				return this.verifyJWT(ctx.params.token);
			}
		},
	},

	/**
	 * Events
	 */
	events: {

	},

	/**
	 * Methods
	 */
	methods: {
		/**
		 * Generate a JWT token from user entity.
		 * 
		 * @param {Object} payload 
		 * @param {String|Number} expiresIn 
		 */
		generateJWT(payload, expiresIn = "90d") {
			return new this.Promise((resolve, reject) => {
				return jwt.sign(payload, this.settings.JWT_SECRET, { expiresIn }, (err, token) => {
					if (err) {
						this.logger.warn("JWT token generation error:", err);
						return reject(new MoleculerRetryableError("Unable to generate token", 500, "UNABLE_GENERATE_TOKEN"));
					}

					resolve(token);
				});
			});
		},

		/**
		 * Verify a JWT token and return the decoded payload
		 * 
		 * @param {String} token 
		 */
		verifyJWT(token) {
			return new this.Promise((resolve, reject) => {
				jwt.verify(token, this.settings.JWT_SECRET, (err, decoded) => {
					if (err) {
						this.logger.warn("JWT verifying error:", err);
						return reject(new MoleculerClientError("Invalid token", 401, "INVALID_TOKEN"));
					}

					resolve(decoded);
				});
			});
		}
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		// this.generate = util.promisify(jwt.sign);
		// this.verify = util.promisify(jwt.verify);
	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {

	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {

	}
};