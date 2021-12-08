"use strict";

module.exports = {
	methods: {
		/**
		 * Validate the `board` property of list.
		 */
		validateBoard({ ctx, value }) {
			return ctx
				.call("v1.boards.resolve", { id: value, throwIfNotExist: true, fields: ["id"] })
				.then(() => true)
				.catch(err => err.message);
		},

		/**
		 * Validate the `board` property of list.
		 */
		validateList({ ctx, value }) {
			return ctx
				.call("v1.lists.resolve", { id: value, throwIfNotExist: true, fields: ["id"] })
				.then(() => true)
				.catch(err => err.message);
		}
	}
};
