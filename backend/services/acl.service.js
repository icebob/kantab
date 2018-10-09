"use strict";

const _ 				= require("lodash");
const DbService 		= require("../mixins/db.mixin");
const CacheCleaner 		= require("../mixins/cache.cleaner.mixin");
const Memoize 			= require("../mixins/memoize.mixin");
const { match } 		= require("moleculer").Utils;
const ConfigLoader 		= require("../mixins/config.mixin");

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
		]),
		ConfigLoader([
		]),
		Memoize()
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
		//{ name: "accounts", version: 1 },
	],

	/**
	 * Actions
	 */
	actions: {
		async hasAccess(ctx) {
			if (!ctx.meta.user)
				return false;

			return await this.hasAccess(ctx, ctx.params);
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

		/**
		 * Assigns the given permission to the role.
		 * @param {Object} role
		 * @param {string} permission
		 */
		async assignPermission(role, permission) {
			if (role.permissions.indexOf(permission) === -1) {
				return await this.adapter.updateById(role._id, { $addToSet: {
					permissions: permission
				}});
			}
			return role;
		},

		/**
		 * Revokes the given permission from the role.
		 *
		 * @param {Object} role
		 * @param {string} permission
		 */
		async revokePermission(role, permission) {
			if (role.permissions.indexOf(permission) !== -1) {
				return await this.adapter.updateById(role._id, { $pull: {
					permissions: permission
				}});
			}
			return role;
		},

		/**
		 * Syncs the given permissions with the role. This will revoke any permissions not supplied.
		 *
		 * @param {Object} role
		 * @param {Array<String>} permissions
		 */
		async syncPermissions(role, permissions) {
			return await this.adapter.updateById(role._id, { $set: {
				permissions: permissions
			}});
		},

		/**
		 * Get all permissions by user roles.
		 *
		 * @param {Array<string>} roleNames
		 * @returns {Array<string>} List of permissions
		 */
		async getPermissions(roleNames) {
			return await this.memoize("permissions", roleNames, async () => {
				roleNames = Array.isArray(roleNames) ? roleNames : [roleNames];

				const roles = await this.adapter.find({ name: { $in: roleNames }});
				const permissions = await roles.map(async role => {
					const res = Array.from(role.permissions);
					if (Array.isArray(role.inherits) && role.inherits.length > 0)
						res.concat(await this.getPermissions(role.inherits));

					return res;
				});

				return _.uniq(permissions);
			});
		},

		/**
		 * Check if user has the given role. A user must have at least one role order for this to return true.
		 *
		 * @param {Context} ctx
		 * @param {string} role
		 * @returns {boolean}
		 */
		async hasRole(ctx, role) {
			return Array.isArray(ctx.meta.user.roles) && ctx.meta.user.roles.indexOf(role) !== -1;
		},

		/**
		 * Checks if the user has the given permission.
		 *
		 * @param {Context} ctx
		 * @param {string} permission
		 * @returns {boolean}
		 */
		async can(ctx, permission) {
			const roleNames = ctx.meta.user.roles;
			if (!Array.isArray(roleNames)) return false;

			const permList = await this.getPermissions(roleNames);
			return permList.find(p => match(permission, p));
		},

		/**
		 * Checks if the user has the given permission(s). At least one permission must be
		 * accountable for in order for this to return true.
		 *
		 * @param {Context} ctx
		 * @param {Array<string>} permissions
		 * @returns {boolean}
		 */
		async canAtLeast(ctx, permissions) {
			const roleNames = ctx.meta.user.roles;
			if (!Array.isArray(roleNames)) return false;

			const permList = await this.getPermissions(roleNames);
			return permissions.some(perm => permList.find(p => match(perm, p)));
		},

		/**
		 * Checks if the user has the given permission(s) or role(s). At least one
		 * permission or role must be accountable for in order for this to return true.
		 *
		 * @param {Context} ctx
		 * @param {Array<string>} permissionAndRoles
		 * @returns {boolean}
		 */
		async hasAccess(ctx, permissionAndRoles) {
			return permissionAndRoles.some(async p => {
				if (p.indexOf(":") !== -1)
					return await this.can(ctx, p);
				else
					return await this.hasRole(ctx, p);
			});
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
						"**"
					],
					status: 1,
					createdAt: Date.now(),
				},

				// User
				{
					name: "user",
					description: "Registered User",
					permissions: [
						"board:create",
						"board:read",
						"board:update",
						"board:remove",
						"cards:create"
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
