"use strict";

const Hashids = require("hashids/cjs");
const hashids = new Hashids(process.env.HASHID_SALT || "K4nTa3");

module.exports = function () {
	return {
		methods: {
			/**
			 * Encode ID of entity.
			 *
			 * @methods
			 * @param {any} id
			 * @returns {any}
			 */
			encodeID(id) {
				if (id != null) return hashids.encodeHex(id);
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
				if (id != null) return hashids.decodeHex(id);
				return id;
			}
		}
	};
};
