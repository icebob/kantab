"use strict";

/**
 * acl service
 *
 * https://blog.nodeswat.com/implement-access-control-in-node-js-8567e7b484d1
 * https://github.com/DeadAlready/easy-rbac
 */
module.exports = {
	name: "acl",
	version: 1,

	/**
	 * Service settings
	 */
	settings: {
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
		{ name: "roles", version: 1 },
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
