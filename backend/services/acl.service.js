"use strict";

const _ 				= require("lodash");
const DbService 		= require("../mixins/db.mixin");
const CacheCleaner 		= require("../mixins/cache.cleaner.mixin");
const Memoize 			= require("../mixins/memoize.mixin");
const { match } 		= require("moleculer").Utils;
const ConfigLoader 		= require("../mixins/config.mixin");
const C 				= require("../constants");

/**
 * Role-based ACL (Access-Control-List) service
 *
 * Special roles:
 * 		- $everyone (unauthenticated users)
 * 		- $authenticated (authenticated user)
 * 		- $owner (owner of entity)
 * 		- $related (???)
 *
 * TODO:
 * 	- role name can't start with $. It's an internal special role marker.
 *  - role name can't contain colon (:). It's a permission separator
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
		fields: {
			id: { type: "string", readonly: true, primaryKey: true, secure: true, columnName: "_id" },
			name: { type: "string" },
			description: { type: "string" },
			permissions: { type: "array" },
			inherits: { type: "array" },
			status: { type: "number", default: 1 },
			createdAt: { type: "number", updateable: false, default: Date.now },
			updatedAt: { type: "number", readonly: true, updateDefault: Date.now },
		},

		permissions: [
			"boards.create",
			"boards.read",
			"boards.edit",
			"boards.remove",
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
		// Change visibility of default actions
		create: {
			visibility: C.VISIBILITY_PROTECTED
		},
		list: {
			visibility: C.VISIBILITY_PROTECTED
		},
		find: {
			visibility: C.VISIBILITY_PROTECTED
		},
		get: {
			visibility: C.VISIBILITY_PROTECTED
		},
		update: {
			visibility: C.VISIBILITY_PROTECTED
		},
		remove: {
			visibility: C.VISIBILITY_PROTECTED
		},

		can: {
			visibility: C.VISIBILITY_PUBLIC,
			cache: {
				keys: ["#roles", "permissions"]
			},
			params: {
				roles: { type: "array", items: "string" },
				permission: { type: "string" },
			},
			async handler(ctx) {
				return await this.can(ctx.params.roles, ctx.params.permission);
			}
		},

		hasAccess: {
			visibility: C.VISIBILITY_PUBLIC,
			cache: {
				keys: ["#roles", "permissions"]
			},
			params: {
				roles: { type: "array", items: "string" },
				permissions: { type: "array", items: "string", min: 1 },
			},
			async handler(ctx) {
				return await this.hasAccess(ctx.params.roles, ctx.params.permissions);
			}
		},

		/**
		 * Assigns the given permission to the role.
		 * @param {String} id
		 * @param {string} permission
		 */
		assignPermission: {
			needEntity: true,
			params: {
				id: "string",
				permission: "string"
			},
			async handler(ctx) {
				const role = await this.assignPermission(ctx.entity, ctx.params.permission);
				const json = await this.transformDocuments(ctx, {}, role);
				this.entityChanged("updated", json, ctx);
				return json;
			}
		},

		/**
		 * Revokes the given permission from the role.
		 *
		 * @param {String} id
		 * @param {string} permission
		 */
		revokePermission: {
			needEntity: true,
			params: {
				id: "string",
				permission: "string"
			},
			async handler(ctx) {
				const role = await this.revokePermission(ctx.entity, ctx.params.permission);
				const json = await this.transformDocuments(ctx, {}, role);
				this.entityChanged("updated", json, ctx);
				return json;
			}
		},

		/**
		 * Syncs the given permissions with the role. This will revoke any permissions not supplied.
		 *
		 * @param {String} id
		 * @param {Array<String>} permissions
		 */
		syncPermissions: {
			needEntity: true,
			params: {
				id: "string",
				permissions: { type: "array", items: "string" }
			},
			async handler(ctx) {
				const role = await this.syncPermissions(ctx.entity, ctx.params.permissions);
				const json = await this.transformDocuments(ctx, {}, role);
				this.entityChanged("updated", json, ctx);
				return json;
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
		 * Assigns the given permission to the role.
		 * @param {Object} role
		 * @param {string} permission
		 */
		async assignPermission(role, permission) {
			if (role.permissions.indexOf(permission) === -1) {
				return await this.adapter.updateById(role._id, {
					$addToSet: {
						permissions: permission
					},
					$set: {
						updatedAt: Date.now()
					}
				});
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
				return await this.adapter.updateById(role._id, {
					$pull: {
						permissions: permission
					},
					$set: {
						updatedAt: Date.now()
					}
				});
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
		 * @param {String|Array<string>} roleNames
		 * @returns {Array<string>} List of permissions
		 */
		async getPermissions(roleNames) {
			return await this.memoize("permissions", roleNames, async () => {
				roleNames = Array.isArray(roleNames) ? roleNames : [roleNames];

				const roles = await this.adapter.find({ query: { name: { $in: roleNames }}});
				const permissions = await this.Promise.map(roles, async role => {
					let res = role.permissions ? Array.from(role.permissions) : [];

					if (Array.isArray(role.inherits) && role.inherits.length > 0)
						res = res.concat(await this.getPermissions(role.inherits));

					return res;
				});

				return _.uniq(_.flattenDeep(permissions));
			});
		},

		/**
		 * Check if user has the given role. A user must have at least one role in order to return true.
		 *
		 * @param {Array<String>|String} roleNames
		 * @param {string} role
		 * @returns {boolean}
		 */
		async hasRole(roleNames, role) {
			roleNames = Array.isArray(roleNames) ? roleNames : [roleNames];
			let res = Array.isArray(roleNames) && roleNames.indexOf(role) !== -1;
			if (!res) {
				// Check inherits
				const entities = await this.adapter.find({ query: { name: { $in: roleNames } }});
				if (Array.isArray(entities) && entities.length > 0) {
					const inherits = _.uniq(_.compact(_.flattenDeep(entities.map(entity => entity.inherits))));
					if (inherits.length > 0)
						res = await this.hasRole(inherits, role);
				}
			}
			return res;
		},

		/**
		 * Checks if the user has the given permission.
		 *
		 * @param {Array<String>|String} roleNames
		 * @param {string} permission
		 * @returns {boolean}
		 */
		async can(roleNames, permission) {
			roleNames = Array.isArray(roleNames) ? roleNames : [roleNames];

			const permList = await this.getPermissions(roleNames);
			return permList.some(p => match(permission, p));
		},

		/**
		 * Checks if the user has the given permission(s). At least one permission must be
		 * accountable in order to return true.
		 *
		 * @param {Array<String>|String} roleNames
		 * @param {Array<string>} permissions
		 * @returns {boolean}
		 */
		async canAtLeast(roleNames, permissions) {
			roleNames = Array.isArray(roleNames) ? roleNames : [roleNames];

			const permList = await this.getPermissions(roleNames);
			return permissions.some(perm => permList.find(p => match(perm, p)));
		},

		/**
		 * Checks if the user has the given permission(s) or role(s). At least one
		 * permission or role must be accountable in order to return true.
		 *
		 * @param {Array<String>|String} roleNames
		 * @param {Array<string>} permissionsAndRoles
		 * @returns {boolean}
		 */
		async hasAccess(roleNames, permissionsAndRoles) {
			const res = await this.Promise.all(permissionsAndRoles.map(async p => {
				if (p.indexOf(".") !== -1)
					return await this.can(roleNames, p);
				else
					return await this.hasRole(roleNames, p);
			}));
			return res.some(p => !!p);
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
