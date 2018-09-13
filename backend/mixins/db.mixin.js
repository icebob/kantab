"use strict";

const _ 			= require("lodash");
const DbService		= require("moleculer-db");
const MongoAdapter 	= require("moleculer-db-adapter-mongo");

module.exports = function(collection, opts = {}) {
	const schema = {
		mixins: [DbService],
		adapter: new MongoAdapter(process.env.MONGO_URI || "mongodb://localhost/kantab"),
		collection,

		methods: {
			entityChanged(type, json, ctx) {
				return this.clearCache().then(() => {
					const eventName = `${this.name}.entity.${type}`;
					this.broker.broadcast(eventName, { meta: ctx.meta, entity: json });
				});
			},

			encodeID(id) {
				return id != null ? id.toString() : null;
			},

			decodeID(id) {
				if (typeof id === "string")
					return this.adapter.stringToObjectID(id);

				return id;
			}
		},

		async afterConnected() {
			const count = await this.adapter.count();
			if (count == 0 && _.isFunction(this.seedDB)) {
				this.logger.info(`Seed '${collection}' collection...`);
				this.seedDB();
			}
		}
	};

	if (opts.disableActions) {
		schema.actions = {
			create: false,
			insert: false,
			count: false,
			list: false,
			find: false,
			get: false,
			update: false,
			remove: false
		};
	}

	return schema;
};
