"use strict";

const DbService		= require("moleculer-db");
const MongoAdapter 	= require("moleculer-db-adapter-mongo");

module.exports = function(collection) {
	return {
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
				return id.toString();
			},

			decodeID(id) {
				if (typeof id === "string")
					return this.adapter.stringToObjectID(id);

				return id;
			}
		}
	};
};
