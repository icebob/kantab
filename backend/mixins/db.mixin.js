"use strict";

const _ 			= require("lodash");
const DbService		= require("moleculer-db");
const MongoAdapter 	= require("moleculer-db-adapter-mongo");

const TESTING = process.env.NODE_ENV === "test";

module.exports = function(collection, opts = {}) {
	const adapter = TESTING ? new DbService.MemoryAdapter() : new MongoAdapter(process.env.MONGO_URI || "mongodb://localhost/kantab");

	const schema = {
		mixins: [DbService],
		adapter,
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
			/* istanbul ignore next */
			if (TESTING) {
				// Create indexes
				if (this.settings.indexes) {
					await this.Promise.all(this.settings.indexes.map(idx => this.adapter.collection.createIndex(idx)));
				}
			}

			// Seeding if the DB is empty
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
