"use strict";

// More info about options: https://moleculer.services/docs/0.13/broker.html#Broker-options
module.exports = {
	namespace: "",
	nodeID: null,

	logger: process.env.TEST_E2E !== "run",
	logLevel: "info",
	logFormatter: "default",
	logObjectPrinter: null,

	serializer: "JSON",

	//requestTimeout: 10 * 1000,
	retryPolicy: {
		enabled: false,
		retries: 5,
		delay: 100,
		maxDelay: 1000,
		factor: 2,
		check: err => err && !!err.retryable
	},

	maxCallLevel: 100,
	heartbeatInterval: 5,
	heartbeatTimeout: 15,

	tracking: {
		enabled: false,
		shutdownTimeout: 5000,
	},

	disableBalancer: false,

	registry: {
		strategy: "RoundRobin",
		preferLocal: true
	},

	circuitBreaker: {
		enabled: false,
		threshold: 0.5,
		windowTime: 60,
		minRequestCount: 20,
		halfOpenTime: 10 * 1000,
		check: err => err && err.code >= 500
	},

	bulkhead: {
		enabled: false,
		concurrency: 10,
		maxQueueSize: 100,
	},

	validation: true,
	validator: null,

	metrics: true,
	metricsRate: 1,

	internalServices: true,
	internalMiddlewares: true,

	hotReload: false,

	// Register custom middlewares
	middlewares: [
		require("./backend/middlewares/CheckPermissions"),
		require("./backend/middlewares/FindEntity"),
	],

	// Called after broker created.
	created(broker) {

	},

	// Called after broker starte.
	started(broker) {
		if (process.env.TEST_E2E) {
			require("./tests/e2e/bootstrap")(broker);
		}

		detectDependencyGraph(broker);
	},

	// Called after broker stopped.
	stopped(broker) {

	},

	replCommands: null
};


function detectDependencyGraph(broker) {
	let mainModule = process.mainModule;

	processModule(broker, mainModule);
}

const path = require("path");
const cache = new Map();
function processModule(broker, mod, service = null, level = 0) {
	const fName = mod.filename;

	// Skip node_modules files
	if (service && fName.indexOf("node_modules") !== -1)
		return;

	// Cache node_modules files to avoid cyclic dependencies
	if (fName.indexOf("node_modules") !== -1) {
		if (cache.get(fName))
			return;

		cache.set(fName, mod);
	}

	let serviceRoot = false;
	if (!service) {
		service = broker.services.find(svc => svc.__filename == fName);
		if (service)
			serviceRoot = true;
	}

	if (service) {
		if (!service.__dependencies)
			service.__dependencies = [];
		service.__dependencies.push(fName);

		const relPath = path.relative(path.resolve("."), fName);

		if (serviceRoot)
			console.log(`\n${" ".repeat(level * 2)} SERVICE: ${service.name} -> ${relPath}`);
		else
			console.log(`${" ".repeat(level * 2)} ${relPath}`);
	}

	if (mod.children && mod.children.length > 0) {
		mod.children.forEach(m => processModule(broker, m, service, service ? level + 1 : 0));
	}
}
