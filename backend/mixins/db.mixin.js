"use strict";

const _ = require("lodash");
const path = require("path");
const mkdir = require("mkdirp").sync;
const DbService = require("database").Service;

const TESTING = process.env.NODE_ENV === "test";

module.exports = function (opts = {}) {
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
					options: { uri: process.env.MONGO_URI || "mongodb://localhost/kantab" }
				}
			});
		}
	}

	const schema = {
		mixins: [DbService(opts)],

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
