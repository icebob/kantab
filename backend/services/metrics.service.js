"use strict";
/*
const Tracer = require("moleculer-console-tracer");
const PromService = require("moleculer-prometheus");

if (process.env.NODE_ENV == "production") {
	// Use Prometheus in production mode
	module.exports = {
		name: "metrics",
		mixins: [PromService],
		settings: {
			port: 3030,
			collectDefaultMetrics: false,
			timeout: 5 * 1000,
		},

		events: {
		}
	};

} else {
	// Use console tracer in development mode
	module.exports = {
		name: "metrics",
		mixins: [Tracer]
	};
}


*/
module.exports = {
	name: "metrics"
};
