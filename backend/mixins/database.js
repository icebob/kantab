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
 * 			{ name: "_id", id: true, type: "string", readonly: true }, // Can't set by user
 *			{ name: "owner", populate: "v1.accounts.populate" }, // Get value from ctx.meta
 * 			{ name: "title", type: "string", trim: true, maxlength: 50 },	// Sanitization & validation
 * 			{ name: "slug", set: (value, entity, ctx) => slug(entity.title) }	// Custom formatter before saving
 * 			{ name: "fullName", get: (value, entity, ctx) => entity.firstName + ' ' + entity.lastName }	// Virtual/calculated field
 * 			{ name: "password", type: "string", hidden: true, validate: (value, entity, ctx) => value.length > 6 },	// Validation
 * 			{ name: "status", type: "Number", optional: true, default: 1 } // Optional field with default value
 * 			{ name: "createdAt", type: "Date", updateable: false, default: Date.now },	// Default value with custom function and can't update this field
 * 			{ name: "updatedAt", type: "Date", readonly: true, updateDefault: () => new Date() }, Default value only at updating. It can't writable by user.
 * 			{ name: "roles", type: "Array", permissions: ["administrator", "$owner"] } // Access control by permissions
 * 			{ name: "members", type: "Array", populate: "v1.accounts.populate", readPermissions: ["$owner"] }
 *
 * 	- [ ] review populates
 * 	- [ ] review transform
 * 	- [x] rewrite `get` action. Rename to `resolve` and write a simple `get` action.
 * 	- [-] add `create`, `find` ...etc methods in order to create new actions easily
 * 	- [ ] tenant handling https://github.com/moleculerjs/moleculer-db/pull/5
 * 	- [ ] monorepo with adapters
 * 	- [?] multi collections in a service
 * 	- [ ] useTimestamps option.
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
			/** @type {String} Name of ID field. */
			idField: "_id",

			/** @type {Array<String|Object>?} Field filtering list. It must be an `Array`. If the value is `null` or `undefined` doesn't filter the fields of entities. */
			fields: null,

			/** @type {Array?} Schema for population. [Read more](#populating). */
			populates: null,

			/** @type {Number} Default page size in `list` action. */
			pageSize: 10,

			/** @type {Number} Maximum page size in `list` action. */
			maxPageSize: 100,

			/** @type {Number} Maximum value of limit in `find` action. Default: `-1` (no limit) */
			maxLimit: -1,

			/** @type {Boolean} Soft delete mode. If true, doesn't remove the entity, just set the `deletedAt` field. */
			softDelete: false,

			/** @type {Boolean} Defined & use `createAt` and `updatedAt` fields in entity */
			useTimestamps: false,


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
			handler(ctx) {
				return this.adapter.find(ctx.params);
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
			handler(ctx) {
				// Remove pagination params
				if (ctx.params && ctx.params.limit)
					ctx.params.limit = null;
				if (ctx.params && ctx.params.offset)
					ctx.params.offset = null;

				return this.adapter.count(ctx.params);
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
			handler(ctx) {
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
			handler(ctx) {
				return this.validateEntity(ctx, null, ctx.params)
					.then(entity => this.adapter.insert(entity));
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
			handler(ctx) {
				return Promise.resolve(ctx.params.entity)
					.then(entity => {
						if (Array.isArray(entity)) {
							return this.validateEntity(ctx, null, ctx.params.entity)
								.then(entities => this.adapter.insertMany(entities));
						} else {
							return this.validateEntity(ctx, null, ctx.params.entity)
								.then(entity => this.adapter.insert(entity));
						}
					});
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
			handler(ctx) {
				let params = ctx.params;
				let id = params.id;

				let origDoc;
				return this.getById(id, true)
					.then(doc => {
						if (!doc)
							return Promise.reject(new EntityNotFoundError(id));

						origDoc = doc;
						return this.transformDocuments(ctx, ctx.params, doc);
					})

					.then(json => {
						if (_.isArray(json) && params.mapping === true) {
							let res = {};
							json.forEach((doc, i) => {
								const id = origDoc[i][this.settings.idField];
								res[id] = doc;
							});

							return res;
						}
						return json;
					});

			}
		};

		schema.hooks.before.populate = ["sanitizeFindHook"];
		// TODO: schema.hooks.after.populate = ["transformHook, "mappingHook"];
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
			handler(ctx) {
				let changes = Object.assign({}, ctx.params);
				delete changes.id;
				delete changes[this.settings.idField];

				return Promise.resolve(ctx.entity)
					.then(entity => this.validateEntity(ctx, entity, changes))
					.then(entity => this.adapter.updateById(ctx.entity[this.settings.idField], { "$set": entity }));
			}
		};

		schema.hooks.before.update = ["findEntity", "entityNotFoundHook"];
		schema.hooks.after.update = ["transformHook", "changedHook"];
	}

	if (opts.createActions === true || opts.createActions.replace === true) {
		/**
		 * Replace an entity by ID.
		 * > After replace, clear the cache & call lifecycle events.
		 *
		 * @actions
		 *
		 * @returns {Object} Replaced entity.
		 *
		 * @throws {EntityNotFoundError} - 404 Entity not found
		 */
		schema.actions.replace = {
			visibility: opts.actionVisibility,
			handler(ctx) {
				let entity = ctx.params;

				// TODO: implement replace in adapters
				return this.adapter.collection.findOneAndUpdate({
					[this.settings.idField]: this.stringToObjectID(ctx.entity[this.settings.idField])
				}, entity, { returnNewDocument : true }).then(res => res.value);
			}
		};

		schema.hooks.before.update = ["findEntity", "entityNotFoundHook"];
		schema.hooks.after.update = ["transformHook", "changedHook"];
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
			params: {
				id: { type: "any" }
			},
			handler(ctx) {
				return this.adapter.removeById(ctx.entity[this.settings.idField]);
			}
		};

		schema.hooks.before.update = ["findEntity", "entityNotFoundHook"];
		schema.hooks.after.update = ["transformHook", "changedHook"];
	}

	/**
	 * Methods
	 */
	schema.methods = {

		/**
		 * Connect to database.
		 */
		connect() {
			return this.adapter.connect().then(() => {
				// Call an 'afterConnected' handler in schema
				if (_.isFunction(this.schema.afterConnected)) {
					try {
						return this.schema.afterConnected.call(this);
					} catch(err) {
					/* istanbul ignore next */
						this.logger.error("afterConnected error!", err);
					}
				}
			});
		},

		/**
		 * Disconnect from database.
		 */
		disconnect() {
			if (this.adapter && _.isFunction(this.adapter.disconnect))
				return this.adapter.disconnect();
		},

		sanitizeFindHook(ctx) {
			ctx.params = this.sanitizeParams(ctx, ctx.params);
		},

		transformHook(ctx, docs) {
			if (ctx.action.rawName == "list")
				return this.transformDocuments(ctx, ctx.params, docs[0]).then(res => [res, docs[1]]);
			else
				return this.transformDocuments(ctx, ctx.params, docs);
		},

		pagingHook(ctx, [docs, total]) {
			const params = ctx.params;
			return this.transformDocuments(ctx, params, docs)
				.then(docs => {
					return {
						// Rows
						rows: docs,
						// Total rows
						total: total,
						// Page
						page: params.page,
						// Page size
						pageSize: params.pageSize,
						// Total pages
						totalPages: Math.floor((total + params.pageSize - 1) / params.pageSize)
					};
				});
		},

		changedHook(ctx, json) {
			return this.entityChanged(ctx.action.rawName + "d", json, ctx).then(() => json);
		},

		findEntity(ctx) {
			let id = ctx.params.id;
			if (id == null)
				id = ctx.params[this.settings.idField];

			if (id != null) {
				ctx.entityID = id;
				return this.getById(id, true);
			}
			return null;
		},

		entityNotFoundHook(ctx, doc) {
			if (!doc)
				return Promise.reject(new EntityNotFoundError(ctx.params.id));

			return doc;
		},

		/**
		 * Sanitize context parameters at `find` action.
		 *
		 * @param {Context} ctx
		 * @param {any} params
		 * @returns {Promise}
		 */
		sanitizeParams(ctx, params) {
			let p = Object.assign({}, params);

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

			return p;
		},

		/**
		 * Get entity(ies) by ID(s).
		 *
		 * @methods
		 * @param {String|Number|Array} id - ID or IDs.
		 * @param {Boolean} decoding - Need to decode IDs.
		 * @returns {Object|Array<Object>} Found entity(ies).
		 */
		getById(id, decoding) {
			return Promise.resolve()
				.then(() => {
					if (_.isArray(id)) {
						return this.adapter.findByIds(decoding ? id.map(this.decodeID) : id);
					} else {
						return this.adapter.findById(decoding ? this.decodeID(id) : id);
					}
				});
		},

		/**
		 * Clear the cache & call entity lifecycle events
		 *
		 * @param {String} type
		 * @param {Object|Array|Number} json
		 * @param {Context} ctx
		 * @returns {Promise}
		 */
		entityChanged(type, json, ctx) {
			return this.clearCache().then(() => {
				const eventName = `entity${_.capitalize(type)}`;
				if (this.schema[eventName] != null) {
					return this.schema[eventName].call(this, json, ctx);
				}
			});
		},

		/**
		 * Clear cached entities
		 *
		 * @methods
		 * @returns {Promise}
		 */
		clearCache() {
			this.broker.broadcast(`cache.clean.${this.name}`);
			if (this.broker.cacher)
				this.broker.cacher.clean(`${this.name}.*`);
			return Promise.resolve();
		},

		/**
		 * Transform the fetched documents
		 *
		 * @param {Array|Object} 	docs
		 * @param {Object} 			Params
		 * @returns {Array|Object}
		 */
		transformDocuments(ctx, params, docs) {
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

			return Promise.resolve(docs)

				// Convert entity to JS object
				.then(docs => docs.map(doc => this.adapter.entityToObject(doc)))

				// Encode IDs
				.then(docs => Promise.all(docs.map(doc => this.reformFields(ctx, params, doc))))

				// Populate
				.then(json => (ctx && params.populate) ? this.populateDocs(ctx, json, params.populate) : json)

				// Return
				.then(json => isDoc ? json[0] : json);
		},

		/**
		 *
		 *
		 * @param {Context} ctx
		 * @param {Object?} params
		 * @param {Object} doc
		 * @returns {Object}
		 */
		reformFields(ctx, params, doc) {
			// Skip if fields in not defined in settings.
			if (!Array.isArray(this.settings.fields) || this.settings.fields.length == 0) return Promise.resolve(doc);

			const wantedFields = params.fields;
			return this.authorizeFields(ctx, true).then(authorizedFields => {

				const res = {};
				const promises = [];

				authorizedFields.forEach(field => {
					if (_.isString(field)) // TODO: move to `created` lifecycle handler as `this.$fields`
						field = { name: field };

					// Skip if the field is not wanted
					if (wantedFields && wantedFields.indexOf(field.name) === -1) return;

					// Skip if hidden
					if (field.hidden === true) return;

					// Virtual or formatted field
					if (_.isFunction(field.get)) {
						const value = field.get.call(this, _.get(doc, field.name), doc, ctx);
						if (isPromise(value))
							promises.push(value.then(v => _.set(res, field.name, v)));
						else
							res[field.name] = value;
					} else {
						const value = _.get(doc, field.name);
						if (value !== undefined) {
							_.set(res, field.name, value);
						}
					}
				});

				return Promise.all(promises).then(() => res);
			});
		},

		/**
		 * Validate an entity before saving & updating
		 *
		 * @param {Context} ctx
		 * @param {Object} entity
		 * @param {Object} changes
		 * @returns {Object} validated entity
		 */
		validateEntity(ctx, entity, changes) {
			const isNew = !entity;
			entity = entity || {};

			// Copy all fields if fields in not defined in settings.
			if (!Array.isArray(this.settings.fields) || this.settings.fields.length == 0) {
				_.forIn(changes, (value, key) => _.set(entity, key, value));

				return entity;
			}

			return this.authorizeFields(ctx, true).then(authorizedFields => {

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
						if (!field.optional)
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
					_.set(updates, field.name, value);
				};

				authorizedFields.forEach(field => {
					if (_.isString(field)) // TODO: move to `created` lifecycle handler as `this.$fields`
						field = { name: field };

					// Custom formatter
					if (!isNew && _.isFunction(field.updateSet))
						return callCustomFn(field, field.updateSet, [_.get(changes, field.name), entity, ctx]);
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
						const defaultValue = isNew ? field.default : field.updateDefault;
						if (defaultValue !== undefined) {
							if (_.isFunction(defaultValue))
								return callCustomFn(field, defaultValue, [_.get(changes, field.name), entity, ctx]);

							value = defaultValue;
						}
					}

					// Set new value to entity
					setValue(field, value);
				});

				return Promise.all(_.compact(promises)).then(() => updates);
			});
		},

		/**
		 * Authorize the required field list. Check the `permissions`
		 * and `readPermissions` against the logged in user's permissions.
		 *
		 * @param {Context} ctx
		 * @param {Boolean} readOnly
		 * @returns {Array}
		 */
		authorizeFields(ctx, readOnly) {
			const res = [];
			const promises = _.compact(this.settings.fields.map(field => {

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

			return Promise.all(promises).then(() => res);
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
		 * Populate documents.
		 *
		 * @param {Context} 		ctx
		 * @param {Array|Object} 	docs
		 * @param {Array}			populateFields
		 * @returns	{Promise}
		 */
		populateDocs(ctx, docs, populateFields) {
			if (!this.settings.populates || !Array.isArray(populateFields) || populateFields.length == 0)
				return Promise.resolve(docs);

			if (docs == null || !_.isObject(docs) || !Array.isArray(docs))
				return Promise.resolve(docs);

			let promises = [];
			_.forIn(this.settings.populates, (rule, field) => {

				if (populateFields.indexOf(field) === -1)
					return; // skip

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
				let idList = _.uniq(_.flattenDeep(_.compact(arr.map(doc => doc[field]))));
				// Replace the received models according to IDs in the original docs
				const resultTransform = (populatedDocs) => {
					arr.forEach(doc => {
						let id = doc[field];
						if (_.isArray(id)) {
							let models = _.compact(id.map(id => populatedDocs[id]));
							doc[field] = models;
						} else {
							doc[field] = populatedDocs[id];
						}
					});
				};

				if (rule.handler) {
					promises.push(rule.handler.call(this, idList, arr, rule, ctx));
				} else if (idList.length > 0) {
					// Call the target action & collect the promises
					const params = Object.assign({
						id: idList,
						mapping: true,
						populate: rule.populate
					}, rule.params || {});

					promises.push(ctx.call(rule.action, params).then(resultTransform));
				}
			});

			return Promise.all(promises).then(() => docs);
		},

	};

	/**
	 * Service created lifecycle event handler
	 */
	schema.created = function() {
		this.adapter = adapter || new MemoryAdapter();

		this.adapter.init(this.broker, this);

		// Transform entity validation schema to checker function
		if (this.broker.validator && _.isObject(this.settings.entityValidator) && !_.isFunction(this.settings.entityValidator)) {
			const check = this.broker.validator.compile(this.settings.entityValidator);
			this.settings.entityValidator = entity => {
				const res = check(entity);
				if (res === true)
					return Promise.resolve();
				else
					return Promise.reject(new ValidationError("Entity validation error!", null, res));
			};
		}
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

	// Export Memory Adapter class
	schema.MemoryAdapter = MemoryAdapter;

	return schema;
};
