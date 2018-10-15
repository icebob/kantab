"use strict";

const _ 			= require("lodash");
const path 			= require("path");
const mkdir			= require("mkdirp").sync;
//const DbService		= require("moleculer-db");
const DbService		= require("./database");
const MongoAdapter 	= require("moleculer-db-adapter-mongo");

const TESTING = process.env.NODE_ENV === "test";
const ISMONGO = !process.env.NEDB_FOLDER;

module.exports = function(collection, opts = {}) {
	let adapter;
	if (TESTING) {
		adapter = new DbService.MemoryAdapter();
	} else {
		if (process.env.NEDB_FOLDER) {
			const dir = path.resolve(process.env.NEDB_FOLDER);
			mkdir(dir);
			adapter = new DbService.MemoryAdapter({ filename: path.join(dir, `${collection}.db`)});
		} else {
			adapter = new MongoAdapter(process.env.MONGO_URI || "mongodb://localhost/kantab");
		}
	}

	const schema = {
		mixins: [DbService(adapter)],
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
				if (typeof id === "string" && this.adapter.stringToObjectID)
					return this.adapter.stringToObjectID(id);

				return id;
			}
		},

		async afterConnected() {
			/* istanbul ignore next */
			if (!TESTING) {
				// Create indexes
				if (this.settings.indexes) {
					try {
						if (_.isFunction(this.adapter.collection.createIndex))
							await this.Promise.all(this.settings.indexes.map(idx => this.adapter.collection.createIndex(idx)));
					} catch(err) {
						this.logger.error("Unable to create indexes.", err);
					}
				}
			}

			if (process.env.TEST_E2E) {
				// Clean collection
				this.logger.info(`Clear '${collection}' collection before tests...`);
				await this.adapter.clear();
			}

			// Seeding if the DB is empty
			const count = await this.adapter.count();
			if (count == 0 && _.isFunction(this.seedDB)) {
				this.logger.info(`Seed '${collection}' collection...`);
				await this.seedDB();
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
