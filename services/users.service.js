"use strict";

const bcrypt = require("bcrypt");

const DbService = require("../mixins/db.mixin");
const CacheCleaner = require("../mixins/cache.cleaner.mixin");
const { MoleculerClientError } = require("moleculer").Errors;

const HASH_SALT_ROUND = 10;
/**
 * users service
 */
module.exports = {
	name: "users",
	version: 1,

	mixins: [
		DbService("users"),
		CacheCleaner([
			"cache.clean.users"
		])
	],

	/**
	 * Service settings
	 */
	settings: {
		fields: [
			"_id",
			"username",
			"firstName",
			"lastName",
			"email",
			"avatar",
			"roles",
			"socialLinks",
			"status",
			"plan",
			"verified",
			"passwordless",
			"createdAt",
			"updatedAt",
			"lastLoginAt"
		]
	},

	/**
	 * Service metadata
	 */
	metadata: {

	},

	/**
	 * Service dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Verify a user by token
		 */
		verify: {
			params: {
				token: "string"				
			},
			async handler(ctx) {
				const user = await this.adapter.findOne({ verificationToken: ctx.params.token });
				if (!user)
					throw new MoleculerClientError("Invalid verification token or expired!", 400, "INVALID_TOKEN");

				return await this.adapter.updateById(user._id, {
					"$set": {
						verified: true,
						verificationToken: null
					}
				});
			}
		},

		checkPasswordlessToken: {
			params: {
				token: "string"
			},
			async handler(ctx) {
				const user = await this.adapter.findOne({ passwordlessToken: ctx.params.token });
				if (!user)
					throw new MoleculerClientError("Invalid token!", 400, "INVALID_TOKEN");

				if (user.passwordlessTokenExpires < Date.now())
					throw new MoleculerClientError("Token expired!", 400, "TOKEN_EXPIRED");

				return this.transformDocuments(ctx, {}, user);
			}
		},

		checkResetPasswordToken: {
			params: {
				token: "string"
			},
			async handler(ctx) {
				const user = await this.adapter.findOne({ resetToken: ctx.params.token });
				if (!user)
					throw new MoleculerClientError("Invalid token!", 400, "INVALID_TOKEN");

				if (user.resetTokenExpires < Date.now())
					throw new MoleculerClientError("Token expired!", 400, "TOKEN_EXPIRED");

				return this.transformDocuments(ctx, {}, user);
			}
		}
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
		async hashPassword(pass) {
			return bcrypt.hash(pass, HASH_SALT_ROUND);
		},

		async seedDB() {
			const res = await this.adapter.insertMany([
				// Administrator
				{
					username: "admin",
					password: await this.hashPassword("admin"),
					firstName: "Administrator",
					lastName: "",
					email: "admin@kantab.moleculer.services",
					avatar: "http://romaniarising.com/wp-content/uploads/2014/02/avatar-admin-robot-150x150.jpg",
					roles: ["admin"],
					socialLinks: {},
					status: 1,
					plan: "full",
					verified: true,
					passwordless: false,					
					createdAt: Date.now(),
				},

				// Test user
				{
					username: "test",
					password: await this.hashPassword("test"),
					firstName: "Test",
					lastName: "User",
					email: "test@kantab.moleculer.services",
					avatar: "http://icons.iconarchive.com/icons/iconshock/real-vista-general/256/administrator-icon.png",
					roles: ["user"],
					socialLinks: {},
					status: 1,
					plan: "free",
					verified: true,
					passwordless: false,
					createdAt: Date.now(),
				}
			]);

			this.logger.info(`Generated ${res.length} users!`);
		}
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {

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