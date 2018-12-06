/*
 * moleculer-database
 * Copyright (c) 2017 MoleculerJS (https://github.com/moleculerjs/database)
 * MIT Licensed
 */

"use strict";

const _ = require("lodash");
const Promise = require("bluebird");
const { isPromise } = require("moleculer").Utils;
const { MoleculerClientError, ValidationError, ServiceSchemaError } = require("moleculer").Errors;

const EntityNotFoundError = require("moleculer-db").EntityNotFoundError;
const MemoryAdapter = require("moleculer-db").MemoryAdapter;

/**
 * Service mixin to access database entities
 *
 * TODO:
 * 	- [ ] enhanced `fields` with visibility, default value...etc
 *      fields: {
 * 			id: { id: true, type: "string", readonly: true, secure: true, columnName: "_id" }, // Can't set by user
 *			owner: { populate: { action: "v1.accounts.resolve", fields: ["id", "name", "avatar"] } }, // Populate via other service
 * 			title: { type: "string", trim: true, maxlength: 50, required: true },	// Sanitization & validation
 * 			slug: { set: (value, entity, ctx) => slug(entity.title) }	// Custom formatter before saving
 * 			fullName: { get: (value, entity, ctx) => entity.firstName + ' ' + entity.lastName }	// Virtual/calculated field
 * 			password: { type: "string", hidden: true, validate: (value, entity, ctx) => value.length > 6 },	// Custom validator
 * 			status: { type: "Number", default: 1 } // Optional field with default value
 * 			roles: { type: "Array", permissions: ["administrator"] } // Access control by permissions
 * 			members: { type: "Array", populate: "v1.accounts.resolve", readPermissions: ["$owner"] }
 * 			postCount: { type: "number", populate(values, entities, ctx) => this.Promise.all(entities.map(async e => e.postCount = await ctx.call("posts.count", { query: { author: e._id } }))) },
 *			createdAt: { type: "number", readonly: true, setOnCreate: () => Date.now() }, // Set value when entity is created
 *			updatedAt: { type: "number", readonly: true, setOnUpdate: () => Date.now() }, // Set value when entity is updated
 *			deletedAt: { type: "number", readonly: true, setOnDelete: () => Date.now() }, // Set value when entity is deleted
 *      }
 *  - [x] change fields to object instead of array. So it can be extended by mixins
 *  - [x] new attributes for fields
 * 			- [ ] `columnName`
 * 			- [ ] `columnType`
 *
 *  - [ ] new set functions: `setOnCreate`, `setOnUpdate`, `setOnDelete`
 * 	- [ ] cascase delete. If an entity deleted, delete this entity from other tables too. (in rdbms)
 *  - [x] change optional to required.
 *  - [x] rewrite to async/await
 * 	- [ ] review populates
 * 	- [ ] review transform
 * 	- [x] rewrite `get` action. Rename to `resolve` and write a simple `get` action.
 * 	- [-] add `create`, `find` ...etc methods in order to create new actions easily
 * 	- [ ] tenant handling https://github.com/moleculerjs/moleculer-db/pull/5
 * 	- [ ] monorepo with adapters
 * 	- [?] multi collections in a service
 *  - [ ] `aggregate` action with params: `type: "sum", "avg", "count", "min", "max"` & `field: "price"`
 * 	- [ ] softDelete option with `deletedAt` and `allowDeleted` params in find, list, get, resolve actions.
 *
 * @name moleculer-database
 * @module Service
 */
module.exports = function(adapter, opts) {
	opts = _.defaultsDeep(opts, {
		createActions: true,
		actionVisibility: "published",
		autoReconnect: true
	});

	const schema = {
		// Must overwrite it
		name: "",

		/**
		 * Default settings
		 */
		settings: {

			/** @type {Object?} Field filtering list. It must be an `Object`. If the value is `null` it won't filter the fields of entities. */
			fields: null,

			/** @type {Number} Default page size in `list` action. */
			pageSize: 10,

			/** @type {Number} Maximum page size in `list` action. */
			maxPageSize: 100,

			/** @type {Number} Maximum value of limit in `find` action. Default: `-1` (no limit) */
			maxLimit: -1,

			/** @type {Boolean} Soft delete mode. If true, doesn't remove the entity, just set the `deletedAt` field. */
			softDelete: false,

		},

		/**
		 * Hooks
		 */
		hooks: {
			before: {},
			after: {},
			errors: {}
		},

		/**
		 * Actions
		 */
		actions: {
			// Empty
		}
	};

	if (opts.createActions === true || opts.createActions.find === true) {
		/**
		 * Find entities by query.
		 *
		 * @actions
		 * @cached
		 *
		 * @param {Array<String>?} populate - Populated fields.
		 * @param {Array<String>?} fields - Fields filter.
		 * @param {Number} limit - Max count of rows.
		 * @param {Number} offset - Count of skipped rows.
		 * @param {String} sort - Sorted fields.
		 * @param {String} search - Search text.
		 * @param {String} searchFields - Fields for searching.
		 * @param {Object} query - Query object. Passes to adapter.
		 *
		 * @returns {Array<Object>} List of found entities.
		 */
		schema.actions.find = {
			visibility: opts.actionVisibility,
			cache: {
				keys: ["populate", "fields", "limit", "offset", "sort", "search", "searchFields", "query"]
			},
			params: {
				populate: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				fields: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				limit: { type: "number", integer: true, min: 0, optional: true, convert: true },
				offset: { type: "number", integer: true, min: 0, optional: true, convert: true },
				sort: { type: "string", optional: true },
				search: { type: "string", optional: true },
				searchFields: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				query: { type: "object", optional: true }
			},
			async handler(ctx) {
				return await this.adapter.find(ctx.params);
			}
		};

		schema.hooks.before.find = ["sanitizeFindHook"];
		schema.hooks.after.find = ["transformHook"];
	}

	if (opts.createActions === true || opts.createActions.count === true) {
		/**
		 * Get count of entities by query.
		 *
		 * @actions
		 * @cached
		 *
		 * @param {String} search - Search text.
		 * @param {String} searchFields - Fields list for searching.
		 * @param {Object} query - Query object. Passes to adapter.
		 *
		 * @returns {Number} Count of found entities.
		 */
		schema.actions.count = {
			visibility: opts.actionVisibility,
			cache: {
				keys: ["search", "searchFields", "query"]
			},
			params: {
				search: { type: "string", optional: true },
				searchFields: { type: "array", optional: true },
				query: { type: "object", optional: true }
			},
			async handler(ctx) {
				// Remove pagination params
				if (ctx.params && ctx.params.limit)
					ctx.params.limit = null;
				if (ctx.params && ctx.params.offset)
					ctx.params.offset = null;

				return await this.adapter.count(ctx.params);
			}
		};

		schema.hooks.before.count = ["sanitizeFindHook"];
	}

	if (opts.createActions === true || opts.createActions.list === true) {
		/**
		 * List entities by filters and pagination results.
		 *
		 * @actions
		 * @cached
		 *
		 * @param {Array<String>?} populate - Populated fields.
		 * @param {Array<String>?} fields - Fields filter.
		 * @param {Number} page - Page number.
		 * @param {Number} pageSize - Size of a page.
		 * @param {String} sort - Sorted fields.
		 * @param {String} search - Search text.
		 * @param {String} searchFields - Fields for searching.
		 * @param {Object} query - Query object. Passes to adapter.
		 *
		 * @returns {Object} List of found entities and count.
		 */
		schema.actions.list = {
			visibility: opts.actionVisibility,
			rest: "GET /",
			cache: {
				keys: ["populate", "fields", "page", "pageSize", "sort", "search", "searchFields", "query"]
			},
			params: {
				populate: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				fields: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				page: { type: "number", integer: true, min: 1, optional: true, convert: true },
				pageSize: { type: "number", integer: true, min: 0, optional: true, convert: true },
				sort: { type: "string", optional: true },
				search: { type: "string", optional: true },
				searchFields: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				query: { type: "object", optional: true }
			},
			async handler(ctx) {
				let params = Object.assign({}, ctx.params);
				let countParams = Object.assign({}, params);

				// Remove pagination params
				if (countParams && countParams.limit)
					countParams.limit = null;
				if (countParams && countParams.offset)
					countParams.offset = null;

				return Promise.all([
				// Get rows
					this.adapter.find(params),

					// Get count of all rows
					this.adapter.count(countParams)
				]);
			}
		};

		schema.hooks.before.list = ["sanitizeFindHook"];
		schema.hooks.after.list = ["transformHook", "pagingHook"];
	}

	if (opts.createActions === true || opts.createActions.create === true) {
		/**
		 * Create a new entity.
		 *
		 * @actions
		 *
		 * @returns {Object} Saved entity.
		 */
		schema.actions.create = {
			visibility: opts.actionVisibility,
			rest: "POST /",
			async handler(ctx) {
				const entity = await this.validateEntity(ctx, null, ctx.params);
				return await this.adapter.insert(entity);
			}
		};

		schema.hooks.after.create = ["transformHook", "changedHook"];
	}

	if (opts.createActions === true || opts.createActions.insert === true) {
		/**
		 * Create many new entities.
		 *
		 * @actions
		 *
		 * @param {Object?} entity - Entity to save.
		 * @param {Array.<Object>?} entities - Entities to save.
		 *
		 * @returns {Object|Array.<Object>} Saved entity(ies).
		 */
		schema.actions.insert = {
			visibility: opts.actionVisibility,
			params: {
				entity: [
					{ type: "object", optional: true },
					{ type: "array", optional: true }
				]
			},
			async handler(ctx) {
				const entity = await this.validateEntity(ctx, null, ctx.params.entity);
				if (Array.isArray(entity))
					return await this.adapter.insertMany(entity);
				else
					return await this.adapter.insert(entity);
			}
		};

		//schema.hooks.before.insert = ["validateHook"];
		schema.hooks.after.insert = ["transformHook", "changedHook"]; // TODO `inserted` instead of [`created]`
	}

	if (opts.createActions === true || opts.createActions.get === true) {
		/**
		 * Get entity by ID.
		 *
		 * @actions
		 * @cached
		 *
		 * @param {any} id - ID of entity.
		 * @param {Array<String>?} populate - Field list for populate.
		 * @param {Array<String>?} fields - Fields filter.
		 * @param {Boolean?} mapping - Convert the returned `Array` to `Object` where the key is the value of `id`.
		 *
		 * @returns {Object} Found entity.
		 *
		 * @throws {EntityNotFoundError} - 404 Entity not found
		 */
		schema.actions.get = {
			visibility: opts.actionVisibility,
			rest: "GET /:id",
			cache: {
				keys: ["id", "populate", "fields"]
			},
			params: {
				id: [
					{ type: "string" },
					{ type: "number" }
				],
				populate: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				fields: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
			},
			handler(ctx) {
				return ctx.entity;
			}
		};

		schema.hooks.before.get = ["sanitizeFindHook", "findEntity", "entityNotFoundHook"];
		schema.hooks.after.get = ["transformHook"];
	}

	if (opts.createActions === true || opts.createActions.resolve === true) {
		/**
		 * Resolve entity(ies) by ID(s).
		 *
		 * @actions
		 * @cached
		 *
		 * @param {any|Array<any>} id - ID(s) of entity.
		 * @param {Array<String>?} populate - Field list for populate.
		 * @param {Array<String>?} fields - Fields filter.
		 * @param {Boolean?} mapping - Convert the returned `Array` to `Object` where the key is the value of `id`.
		 *
		 * @returns {Object|Array<Object>} Found entity(ies).
		 *
		 * @throws {EntityNotFoundError} - 404 Entity not found
		 */
		schema.actions.resolve = {
			visibility: opts.actionVisibility,
			cache: {
				keys: ["id", "populate", "fields", "mapping"]
			},
			params: {
				id: [
					{ type: "string" },
					{ type: "number" },
					{ type: "array" }
				],
				populate: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				fields: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				mapping: { type: "boolean", optional: true }
			},
			async handler(ctx) {
				const doc = ctx.entity;
				const json = await this.transformDocuments(ctx, ctx.params, doc);
				if (Array.isArray(json) && ctx.params.mapping === true) {
					let res = {};
					json.forEach((doc, i) => {
						// TODO const id = ctx.entity[i][this.$primaryField.name];
						const id = json[i][this.$primaryField.name];
						res[id] = doc;
					});

					return res;
				}
				return json;
			}
		};

		schema.hooks.before.resolve = ["sanitizeFindHook", "findEntity", "entityNotFoundHook"];
		// TODO: schema.hooks.after.resolve = ["transformHook, "mappingHook"];
	}

	if (opts.createActions === true || opts.createActions.update === true) {
		/**
		 * Update an entity by ID.
		 * > After update, clear the cache & call lifecycle events.
		 *
		 * @actions
		 *
		 * @returns {Object} Updated entity.
		 *
		 * @throws {EntityNotFoundError} - 404 Entity not found
		 */
		schema.actions.update = {
			visibility: opts.actionVisibility,
			rest: "PATCH /:id",
			async handler(ctx) {
				let changes = Object.assign({}, ctx.params);
				delete changes[this.$primaryField.name];

				const entity = await this.validateEntity(ctx, ctx.entity, changes);
				return await this.adapter.updateById(ctx.entityID, { "$set": entity });
			}
		};

		schema.hooks.before.update = ["findEntity", "entityNotFoundHook"];
		schema.hooks.after.update = ["transformHook", "changedHook"];
	}

	if (opts.createActions === true || opts.createActions.replace === true) {
		/**
		 * Replace an entity by ID.
		 * > After replacing, clear the cache & call lifecycle events.
		 *
		 * @actions
		 *
		 * @returns {Object} Replaced entity.
		 *
		 * @throws {EntityNotFoundError} - 404 Entity not found
		 */
		schema.actions.replace = {
			visibility: opts.actionVisibility,
			rest: "PUT /:id",
			async handler(ctx) {
				let entity = ctx.params;

				// TODO: implement replace in adapters
				const res = await this.adapter.collection.findOneAndUpdate({
					[this.$primaryField.name]: this.stringToObjectID(ctx.entity[this.$primaryField.name])
				}, entity, { returnNewDocument : true });
				return res.value;
			}
		};

		schema.hooks.before.replace = ["findEntity", "entityNotFoundHook"];
		schema.hooks.after.replace = ["transformHook", "changedHook"];
	}

	if (opts.createActions === true || opts.createActions.remove === true) {
		/**
		 * Remove an entity by ID.
		 *
		 * @actions
		 *
		 * @param {any} id - ID of entity.
		 * @returns {Number} Count of removed entities.
		 *
		 * @throws {EntityNotFoundError} - 404 Entity not found
		 */
		schema.actions.remove = {
			visibility: opts.actionVisibility,
			rest: "DELETE /:id",
			params: {
				id: { type: "any" }
			},
			async handler(ctx) {
				return await this.adapter.removeById(ctx.entityID);
			}
		};

		schema.hooks.before.remove = ["findEntity", "entityNotFoundHook"];
		schema.hooks.after.remove = ["transformHook", "changedHook"];
	}

	/**
	 * Methods
	 */
	schema.methods = {

		/**
		 * Connect to database.
		 */
		async connect() {
			await this.adapter.connect();

			// Call an 'afterConnected' handler in schema
			if (_.isFunction(this.schema.afterConnected)) {
				try {
					return await this.schema.afterConnected.call(this);
				} catch(err) {
				/* istanbul ignore next */
					this.logger.error("afterConnected error!", err);
				}
			}
		},

		/**
		 * Disconnect from database.
		 */
		disconnect() {
			if (this.adapter && _.isFunction(this.adapter.disconnect))
				return this.adapter.disconnect();
		},

		// --- HOOKS ---

		/**
		 *
		 *
		 * @param {Context} ctx
		 */
		sanitizeFindHook(ctx) {
			let p = Object.assign({}, ctx.params);

			// Convert from string to number
			if (typeof(p.limit) === "string")
				p.limit = Number(p.limit);
			if (typeof(p.offset) === "string")
				p.offset = Number(p.offset);
			if (typeof(p.page) === "string")
				p.page = Number(p.page);
			if (typeof(p.pageSize) === "string")
				p.pageSize = Number(p.pageSize);

			if (typeof(p.sort) === "string")
				p.sort = p.sort.replace(/,/g, " ").split(" ");

			if (typeof(p.fields) === "string")
				p.fields = p.fields.replace(/,/g, " ").split(" ");

			if (typeof(p.populate) === "string")
				p.populate = p.populate.replace(/,/g, " ").split(" ");

			if (typeof(p.searchFields) === "string")
				p.searchFields = p.searchFields.replace(/,/g, " ").split(" ");

			if (ctx.action.name.endsWith(".list")) {
				// Default `pageSize`
				if (!p.pageSize)
					p.pageSize = this.settings.pageSize;

				// Default `page`
				if (!p.page)
					p.page = 1;

				// Limit the `pageSize`
				if (this.settings.maxPageSize > 0 && p.pageSize > this.settings.maxPageSize)
					p.pageSize = this.settings.maxPageSize;

				// Calculate the limit & offset from page & pageSize
				p.limit = p.pageSize;
				p.offset = (p.page - 1) * p.pageSize;
			}
			// Limit the `limit`
			if (this.settings.maxLimit > 0 && p.limit > this.settings.maxLimit)
				p.limit = this.settings.maxLimit;

			ctx.params = p;
		},

		/**
		 *
		 *
		 * @param {Context} ctx
		 * @param {*} docs
		 * @returns
		 */
		async transformHook(ctx, docs) {
			if (ctx.action.rawName == "list") {
				const res = await this.transformDocuments(ctx, ctx.params, docs[0]);
				return [res, docs[1]];
			}
			return await this.transformDocuments(ctx, ctx.params, docs);
		},

		/**
		 *
		 *
		 * @param {Context} ctx
		 * @param {*} [docs, total]
		 * @returns
		 */
		async pagingHook(ctx, [docs, total]) {
			const params = ctx.params;
			const rows = await this.transformDocuments(ctx, params, docs);
			return {
				// Rows
				rows,
				// Total rows
				total: total,
				// Page
				page: params.page,
				// Page size
				pageSize: params.pageSize,
				// Total pages
				totalPages: Math.floor((total + params.pageSize - 1) / params.pageSize)
			};
		},

		/**
		 * Clear the cache & call entity lifecycle events
		 *
		 * @param {Context} ctx
		 * @param {*} json
		 * @returns
		 */
		async changedHook(ctx, json) {
			const type = ctx.action.rawName + "d";
			await this.clearCache();
			const eventName = `entity${_.capitalize(type)}`;
			if (this.schema[eventName] != null)
				await this.schema[eventName].call(this, json, ctx);

			return json;
		},

		/**
		 *
		 *
		 * @param {Context} ctx
		 * @returns
		 */
		async findEntity(ctx) {
			let id = ctx.params[this.$primaryField.name];
			if (id == null)
				id = ctx.params.id;

			if (id != null) {
				ctx.entityID = id;
				const entity = await this.getById(id, true);
				ctx.entity = entity;
			}
			return null;
		},

		/**
		 *
		 *
		 * @param {Context} ctx
		 * @returns
		 */
		entityNotFoundHook(ctx) {
			if (!ctx.entity)
				return Promise.reject(new EntityNotFoundError(ctx.entityID));
		},

		/**
		 * Get entity(ies) by ID(s).
		 *
		 * @methods
		 * @param {String|Number|Array} id - ID or IDs.
		 * @param {Boolean} decoding - Need to decode IDs.
		 * @returns {Object|Array<Object>} Found entity(ies).
		 */
		async getById(id, decoding) {
			if (Array.isArray(id))
				return await this.adapter.findByIds(decoding ? id.map(this.decodeID) : id);

			return await this.adapter.findById(decoding ? this.decodeID(id) : id);
		},

		/**
		 * Clear cached entities
		 *
		 * @methods
		 * @returns {Promise}
		 */
		async clearCache() {
			this.broker.broadcast(`cache.clean.${this.name}`);
			if (this.broker.cacher)
				this.broker.cacher.clean(`${this.name}.*`);
		},

		/**
		 *
		 *
		 * @param {Context} ctx
		 * @param {Object?} params
		 * @param {Object} doc
		 * @param {Array<Object>} allFields
		 * @returns {Object}
		 */
		async reformFields(ctx, params, doc, allFields) {
			// Skip if fields is not defined in settings.
			if (!this.$fields) return Promise.resolve(doc);

			const wantedFields = params.fields;

			const res = {};
			const promises = [];

			const setValue = (res, field, value) => {
				// Encode secure ID
				if (field.primaryKey && field.secure && value != null)
					value = this.encodeID(value);

				_.set(res, field.name, value);
			};

			allFields.forEach(field => {
				// Skip if the field is not wanted
				if (wantedFields && wantedFields.indexOf(field.name) === -1) return;

				// Skip if hidden
				if (field.hidden === true) return;

				const value = _.get(doc, field.columnName || field.name);

				// Virtual or formatted field
				if (_.isFunction(field.get)) {
					const value = field.get.call(this, value, doc, ctx);
					if (isPromise(value))
						promises.push(value.then(v => setValue(res, field, v)));
					else
						setValue(res, field, value);

					return;
				}

				if (value !== undefined) {
					setValue(res, field, value);
				}
			});

			await Promise.all(promises);
			return res;
		},

		/**
		 * Validate an entity before saving & updating
		 *
		 * @param {Context} ctx
		 * @param {Object} entity
		 * @param {Object} changes
		 * @returns {Object} validated entity
		 */
		async validateEntity(ctx, entity, changes) {
			const isNew = !entity;
			entity = entity || {};

			// Copy all fields if fields in not defined in settings.
			if (!this.$fields) {
				_.forIn(changes, (value, key) => _.set(entity, key, value));

				return entity;
			}

			const authorizedFields = await this.authorizeFields(ctx, true);

			const updates = {};
			const promises = [];

			const callCustomFn = (field, fn, args) => {
				const value = fn.apply(this, args);
				if (isPromise(value))
					promises.push(value.then(v => setValue(field, v)));
				else
					setValue(field, value);
			};

			const setValue = (field, value) => {
				// Sanitizing
				if (field.trim) {
					if (field.trim === true)
						value = value.trim();
					else if (field.trim === "right")
						value = value.trimRight();
					else if (field.trim === "left")
						value = value.trimLeft();
				}

				// TODO: more sanitization
				// - lowercase, uppercase, ...etc

				// Validating
				if (value == undefined) {
					if (field.required && isNew)
						promises.push(Promise.reject(new ValidationError(`The '${field.name}' field is missing.`))); // TODO
					return;
				}

				/**
				 * TODO:
				 * 	- custom validate fn
				 *  - min, max for number
				 *  - pattern for string
				 */


				_.set(entity, field.name, value);

				// Because the key is the path. Mongo overwrites a nested object if set a nested object
				updates[field.name] = value;
			};

			authorizedFields.forEach(field => {
				// Custom formatter
				if (isNew && _.isFunction(field.setOnCreate))
					return callCustomFn(field, field.setOnCreate, [_.get(changes, field.name), entity, ctx]);
				else if (!isNew && _.isFunction(field.setOnUpdate))
					return callCustomFn(field, field.setOnUpdate, [_.get(changes, field.name), entity, ctx]);
				else if (_.isFunction(field.set))
					return callCustomFn(field, field.set, [_.get(changes, field.name), entity, ctx]);

				// Get new value
				let value = _.get(changes, field.name);

				if (value !== undefined) {
					// Skip if readonly field
					if (field.readonly) return;

					// Skip if not allowed to update the field
					if (!isNew && field.updateable === false) return;
				}

				// Get previous value
				const prevValue = _.get(entity, field.name);

				// Skip if update and field is not defined but has previous value.
				if (!isNew && value == undefined && prevValue !== undefined) return;

				// Handle default value if new entity
				if (value == undefined) {
					const defaultValue = field.default;
					if (defaultValue !== undefined) {
						if (_.isFunction(defaultValue))
							return callCustomFn(field, defaultValue, [_.get(changes, field.name), entity, ctx]);

						value = defaultValue;
					}
				}

				// Set new value to entity
				setValue(field, value);
			});

			await Promise.all(_.compact(promises));
			return updates;
		},

		/**
		 * Authorize the required field list. Check the `permissions`
		 * and `readPermissions` against the logged in user's permissions.
		 *
		 * @param {Context} ctx
		 * @param {Boolean} readOnly
		 * @returns {Array}
		 */
		async authorizeFields(ctx, readOnly) {
			const res = [];

			const promises = _.compact(this.$fields.map(field => {

				if (readOnly && field.readPermissions) {
					return this.checkAuthority(ctx, field.readPermissions)
						.then(has => has ? res.push(field) : null);
				}

				if (field.permissions) {
					return this.checkAuthority(ctx, field.permissions)
						.then(has => has ? res.push(field) : null);
				}

				res.push(field);
			}));

			await Promise.all(promises);
			return res;
		},

		/**
		 *
		 *
		 * @param {Context} ctx
		 * @param {Array<String>} permissions
		 * @returns {Promise<Boolean>}
		 */
		checkAuthority(ctx, permissions) {
			return ctx.call("v1.acl.hasAccess", { roles: ctx.meta.roles, permissions });
		},

		/**
		 * Transform the fetched documents
		 *
		 * @param {Array|Object} 	docs
		 * @param {Object} 			Params
		 * @returns {Array|Object}
		 */
		async transformDocuments(ctx, params, docs) {
			let isDoc = false;
			if (!Array.isArray(docs)) {
				if (_.isObject(docs)) {
					isDoc = true;
					docs = [docs];
				}
				else {
					// It's a number value (like count) or anything else.
					return Promise.resolve(docs);
				}
			}

			// Convert entity to JS object
			let json = docs.map(doc => this.adapter.entityToObject(doc));

			// Reforming & populating if fields is defined in settings.
			if (this.$fields) {

				// Get authorized fields
				const authorizedFields = await this.authorizeFields(ctx, true);

				// Populate
				if (ctx && params.populate)
					json = await this.populateDocs(ctx, json, params.populate, authorizedFields);

				// Reform object
				json = await Promise.all(json.map(doc => this.reformFields(ctx, params, doc, authorizedFields)));
			}

			// Return
			return isDoc ? json[0] : json;
		},

		/**
		 * Populate documents.
		 *
		 * @param {Context} 		ctx
		 * @param {Array|Object} 	docs
		 * @param {Array}			populateFields
		 * @param {Array<Object>} 	allFields
		 * @returns	{Promise}
		 */
		async populateDocs(ctx, docs, populateFields, allFields) {
			if (!Array.isArray(populateFields) || populateFields.length == 0)
				return docs;

			if (docs == null || !_.isObject(docs) || !Array.isArray(docs))
				return docs;

			let promises = [];
			allFields.forEach(field => {

				if (field.populate == null)
					return; //Skip

				if (populateFields.indexOf(field.name) === -1)
					return; // skip

				let rule = field.populate;
				// if the rule is a function, save as a custom handler
				if (_.isFunction(rule)) {
					rule = {
						handler: Promise.method(rule)
					};
				}

				// If string, convert to object
				if (_.isString(rule)) {
					rule = {
						action: rule
					};
				}
				rule.field = field;

				let arr = Array.isArray(docs) ? docs : [docs];

				// Collect IDs from field of docs (flatten, compact & unique list)
				// TODO handle `get`
				let idList = _.uniq(_.flattenDeep(_.compact(arr.map(doc => _.get(doc, field.name)))));
				// Replace the received models according to IDs in the original docs
				const resultTransform = (populatedDocs) => {
					if (populatedDocs == null) return;

					arr.forEach(doc => {
						let id = _.get(doc, field.name);
						if (Array.isArray(id)) {
							_.set(doc, field.name, _.compact(id.map(id => populatedDocs[id])));
						} else {
							_.set(doc, field.name, populatedDocs[id]);
						}
					});
				};

				if (rule.handler) {
					promises.push(rule.handler.call(this, idList, arr, ctx, rule));
				} else if (idList.length > 0) {
					// Call the target action & collect the promises
					const params = Object.assign({
						id: idList,
						mapping: true,
						fields: rule.fields,
						populate: rule.populate
					}, rule.params || {});

					promises.push(ctx.call(rule.action, params).then(resultTransform));
				}
			});

			await Promise.all(promises);
			return docs;
		},


		/**
		 * Encode ID of entity.
		 *
		 * @methods
		 * @param {any} id
		 * @returns {any}
		 */
		encodeID(id) {
			return id;
		},

		/**
		 * Decode ID of entity.
		 *
		 * @methods
		 * @param {any} id
		 * @returns {any}
		 */
		decodeID(id) {
			return id;
		}
	};

	/**
	 * Service created lifecycle event handler
	 */
	schema.created = function() {
		this.adapter = adapter || new MemoryAdapter();

		this.adapter.init(this.broker, this);

		this.$fields = null;

		if (_.isObject(this.settings.fields)) {
			this.$fields = _.compact(_.map(this.settings.fields, (value, name) => {
				// Disabled field
				if (value === false)
					return;

				// Shorthand format { title: true } => { title: {} }
				if (value === true)
					value = {};

				// Shorthand format: { title: "string" } => { title: { type: "string" } }
				if (_.isString(value))
					value = { type: value };

				// Copy the properties
				let field = Object.assign({}, value);

				// Set name of field
				field.name = name;

				if (field.primaryKey === true)
					this.$primaryField = field;

				return field;
			}));
		}

		if (!this.$primaryField)
			this.$primaryField = { name: "_id" };

	};

	/**
	 * Service started lifecycle event handler
	 */
	schema.started = function()  {
		if (this.adapter) {
			return new Promise(resolve => {
				let connecting = () => {
					this.connect().then(resolve).catch(err => {
						this.logger.error("Connection error!", err);
						if (opts.autoReconnect) {
							setTimeout(() => {
								this.logger.warn("Reconnecting...");
								connecting();
							}, 1000);
						}
					});
				};

				connecting();
			});
		}

		/* istanbul ignore next */
		return Promise.reject(new ServiceSchemaError("Please configure a database adapter!"));
	};

	/**
	 * Service stopped lifecycle event handler
	 */
	schema.stopped = function() {
		if (this.adapter)
			return this.disconnect();
	};

	return schema;
};

// Export Memory Adapter class
module.exports.MemoryAdapter = MemoryAdapter;
