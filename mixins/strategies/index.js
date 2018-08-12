"use strict";

const glob = require("glob").sync;

module.exports = function() {
	return glob("*.strategy.js", { cwd: __dirname });
};