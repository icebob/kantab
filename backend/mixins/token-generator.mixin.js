"use strict";

const UIDGenerator = require("uid-generator");
const uidgen = new UIDGenerator(256);

module.exports = {
	methods: {
		generateToken() {
			return uidgen.generateSync();
		}
	}
};
