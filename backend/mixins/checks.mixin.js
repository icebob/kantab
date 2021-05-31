module.exports = {
	/**
	 * Methods
	 */
	methods: {
		/**
		 * Internal method to check the owner of entity. (called from CheckPermission middleware)
		 *
		 * @param {Context} ctx
		 * @returns {Promise<Boolean>}
		 */
		async isEntityOwner(ctx) {
			return !!(ctx.locals.entity && ctx.locals.entity.owner == ctx.meta.userID);
		},

		/**
		 * Internal method to check the membership of board.
		 *
		 * @param {Context} ctx
		 * @returns {Promise<Boolean>}
		 */
		async isBoardMember(ctx) {
			if (!ctx.locals.entity || !ctx.meta.userID) return false;

			// In boards service
			const board =
				this.name == "boards"
					? ctx.locals.entity
					: await ctx.call("v1.boards.resolve", { id: ctx.locals.entity.board });

			if (!board) return false;

			return board.members.includes(ctx.meta.userID);
		}
	}
};
