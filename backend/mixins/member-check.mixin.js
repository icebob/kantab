"use strict";

const _ = require("lodash");

module.exports = {
	/**
	 * Methods
	 */
	methods: {
		/**
		 * Try to resolve the board entity in order to check the permissions.
		 *
		 * @param {Context} ctx
		 * @returns
		 */
		async _getBoardEntity(ctx) {
			if (this.name == "boards") {
				if (ctx.locals.entity && ctx.locals.entity.owner && ctx.locals.entity.members) {
					return ctx.locals.entity;
				} else {
					return ctx.call("v1.boards.resolve", { id: ctx.locals.entity.id });
				}
			} else {
				if (ctx.locals.entity) {
					if (_.isObject(ctx.locals.entity.board)) {
						return ctx.call("v1.boards.resolve", { id: ctx.locals.entity.board.id });
					} else if (_.isString(ctx.locals.entity.board)) {
						return ctx.call("v1.boards.resolve", { id: ctx.locals.entity.board });
					} else if (_.isObject(ctx.locals.entity.list)) {
						const list = await ctx.call("v1.lists.resolve", {
							id: ctx.locals.entity.list.id
						});
						return ctx.call("v1.boards.resolve", { id: list.board });
					} else if (_.isString(ctx.locals.entity.list)) {
						const list = await ctx.call("v1.lists.resolve", {
							id: ctx.locals.entity.list
						});
						return ctx.call("v1.boards.resolve", { id: list.board });
					}
				} else if (_.isString(ctx.params.board)) {
					return ctx.call("v1.boards.resolve", { id: ctx.params.board });
				} else if (_.isString(ctx.params.list)) {
					const list = await ctx.call("v1.lists.resolve", { id: ctx.params.list });
					return ctx.call("v1.boards.resolve", { id: list.board });
				}
			}
		},

		/**
		 * Internal method to check the owner of entity. (called from CheckPermission middleware)
		 *
		 * @param {Context} ctx
		 * @returns {Promise<Boolean>}
		 */
		async isBoardOwner(ctx) {
			if (ctx.meta.$repl) return true;
			if (!ctx.meta.userID) return false;

			const board = await this._getBoardEntity(ctx);
			return board != null && board.owner == ctx.meta.userID;
		},

		/**
		 * Internal method to check the membership of board.
		 *
		 * @param {Context} ctx
		 * @returns {Promise<Boolean>}
		 */
		async isBoardMember(ctx) {
			if (ctx.meta.$repl) return true;
			if (!ctx.meta.userID) return false;

			const board = await this._getBoardEntity(ctx);
			return board != null && board.members.includes(ctx.meta.userID);
		}
	}
};
