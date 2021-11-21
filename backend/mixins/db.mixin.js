"use strict";

const _ = require("lodash");
const crypto = require("crypto");
const path = require("path");
const mkdir = require("mkdirp").sync;
const DbService = require("@moleculer/database").Service;
const HashIds = require("hashids/cjs");
const ObjectID = require("mongodb").ObjectID;

const TESTING = process.env.NODE_ENV === "test";

module.exports = function (opts = {}) {
	if (!process.env.TOKEN_SALT && (TESTING || process.env.TEST_E2E)) {
		process.env.HASHID_SALT = crypto.randomBytes(32).toString("hex");
	}

	const hashids = new HashIds(process.env.HASHID_SALT || "K4nTa3");

	if (TESTING || process.env.ONLY_GENERATE) {
		opts = _.defaultsDeep(opts, {
			adapter: "NeDB"
		});
	} else {
		if (process.env.NEDB_FOLDER) {
			const dir = path.resolve(process.env.NEDB_FOLDER);
			mkdir(dir);
			opts = _.defaultsDeep(opts, {
				adapter: {
					type: "NeDB",
					options: { filename: path.join(dir, `${opts.collection}.db`) }
				}
			});
		} else {
			opts = _.defaultsDeep(opts, {
				adapter: {
					type: "MongoDB",
					options: {
						uri: process.env.MONGO_URI || "mongodb://localhost/kantab",
						collection: opts.collection
					}
				}
			});
		}
	}

	const schema = {
		mixins: [DbService(opts)],

		methods: !TESTING
			? {
					encodeID(id) {
						if (ObjectID.isValid(id)) id = id.toString();
						return hashids.encodeHex(id);
					},

					decodeID(id) {
						return hashids.decodeHex(id);
					}
			  }
			: undefined,

		created() {
			if (!process.env.HASHID_SALT) {
				this.broker.fatal("Environment variable 'HASHID_SALT' must be configured!");
			}
		},

		async started() {
			/* istanbul ignore next */
			if (!TESTING) {
				try {
					// Create indexes
					await this.createIndexes();
				} catch (err) {
					this.logger.error("Unable to create indexes.", err);
				}
			}

			if (process.env.TEST_E2E) {
				// Clean collection
				this.logger.info(`Clear '${opts.collection}' collection before tests...`);
				await this.clearEntities();
			}

			// Seeding if the DB is empty
			const count = await this.countEntities(null, {});
			if (count == 0 && _.isFunction(this.seedDB)) {
				this.logger.info(`Seed '${opts.collection}' collection...`);
				await this.seedDB();
			}
		}
	};

	return schema;
};
