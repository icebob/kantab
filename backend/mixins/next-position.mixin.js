"use strict";

module.exports = {
	methods: {
		getNextPosition(ctx) {
			return this.findEntities(ctx).then(
				rows => rows.reduce((a, row) => Math.max(a, row.position), 0) + 1
			);
		}
	}
};
