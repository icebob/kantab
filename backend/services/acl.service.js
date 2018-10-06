"use strict";

const DbService 	= require("../mixins/db.mixin");
const CacheCleaner 	= require("../mixins/cache.cleaner.mixin");

/**
 * Role-based ACL (Access-Control-List) service
 *
 * https://blog.nodeswat.com/implement-access-control-in-node-js-8567e7b484d1
 * https://github.com/DeadAlready/easy-rbac
 * https://packagist.org/packages/visualappeal/laravel-rbac
 * https://github.com/kodeine/laravel-acl/wiki/Create-Permissions
 * https://yajrabox.com/docs/laravel-acl/3.0/auth#can-at-least
 *
 */
module.exports = {
	name: "acl",
	version: 1,

	mixins: [
		DbService("roles"),
		CacheCleaner([
			"cache.clean.acl"
		])
	],

	/**
	 * Service settings
	 */
	settings: {
		fields: [
			"_id",
			"name",
			"description",
			"permissions",
			"inherits",
			"status",
			"createdAt",
			"updatedAt"
		],

		permissions: [
			"boards:create",
			"boards:read",
			"boards:edit",
			"boards:remove",
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
	dependencies: [
		{ name: "accounts", version: 1 },
	],

	/**
	 * Actions
	 */
	actions: {

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
		 * Assigns the given permission to the role.
		 * @param {Object} role
		 * @param {string} permission
		 */
		assignPermission(role, permission) {

		},

		/**
		 * Revokes the given permission from the role.
		 *
		 * @param {Object} role
		 * @param {string} permission
		 */
		revokePermission(role, permission) {

		},

		/**
		 * Syncs the given permissions with the role. This will revoke any permissions not supplied.
		 *
		 * @param {Object} role
		 * @param {Array<String>} permissions
		 */
		syncPermissions(role, permissions) {

		},

		/**
		 * Get all permissions by user roles.
		 *
		 * @param {Array<string>} roles
		 * @returns {Array<string>} List of permissions
		 */
		getPermissions(roles) {

		},

		/**
		 * Check if user has the given role. A user must have at least one role order for this to return true.
		 *
		 * @param {string} role
		 * @returns {boolean}
		 */
		hasRole(role) {

		},

		/**
		 * Checks if the user has the given permission.
		 *
		 * @param {string} permission
		 * @returns {boolean}
		 */
		can(permission) {

		},

		/**
		 * Checks if the user has the given permission(s). At least one permission must be
		 * accountable for in order for this to return true.
		 *
		 * @param {Array<string>} permissions
		 * @returns {boolean}
		 */
		canAtLeast(permissions) {

		},

		/**
		 * Checks if the user has the given permission(s) or role(s). At least one
		 * permission or role must be accountable for in order for this to return true.
		 *
		 * @param {Array<string>} permissionAndRoles
		 * @returns {boolean}
		 */
		canAccess(permissionAndRoles) {

		},


		/**
		 * Seed an empty collection with an `admin` and a `user` roles.
		 */
		async seedDB() {
			const res = await this.adapter.insertMany([
				// Administrator
				{
					name: "administrator",
					description: "System Administrator",
					permissions: [
						"*"
					],
					status: 1,
					createdAt: Date.now(),
				},

				// User
				{
					name: "user",
					description: "Registered User",
					permissions: [
						"board:create"
					],
					status: 1,
					createdAt: Date.now(),
				}
			]);

			this.logger.info(`Generated ${res.length} ACL roles.`);
		},
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
