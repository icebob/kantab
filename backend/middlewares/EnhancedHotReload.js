"use strict";

const fs = require("fs");
const path = require("path");
const _ = require("lodash");

const { clearRequireCache } = require("moleculer").Utils;

const cache = new Map();

/**
 * Detect service dependency graph.
 *
 * @param {ServiceBroker} broker
 */
function detectDependencyGraph(broker) {
	const mainModule = process.mainModule;

	processModule(broker, mainModule);

	const dependencies = {};

	broker.services.forEach(svc => {
		if (Array.isArray(svc.__dependencies)) {
			svc.__dependencies.forEach(fName => {
				let item = dependencies[fName];
				if (!item) {
					item = {
						services: []
					};
					dependencies[fName] = item;
				}

				if (item.services.indexOf(svc) === -1)
					item.services.push(svc);
			});
		}
	});

	console.log(" ");

	const needToReload = new Set();

	const reloadServices = _.debounce(() => {
		needToReload.forEach(svc => broker.hotReloadService(svc));
		needToReload.clear();
	}, 500);


	Object.keys(dependencies).forEach(fName => {
		const item = dependencies[fName];

		console.log(`Watch ${fName}... (services: ${item.services.length})`);
		const watcher = fs.watch(fName, (eventType, filename) => {
			broker.logger.info(`The ${fName} is changed. (Type: ${eventType})`);

			//watcher.close();

			// TODO clear the full dependency path cache
			clearRequireCache(fName);

			if (Array.isArray(item.services)) {
				item.services.forEach(svc => needToReload.add(svc));
			}
			reloadServices();
		});
	});
}

/**
 * Process module children modules.
 *
 * @param {ServiceBroker} broker
 * @param {*} mod
 * @param {*} service
 * @param {Number} level
 */
function processModule(broker, mod, service = null, level = 0, parentMod = null) {
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

	} else {
		if (parentMod && parentMod.filename.endsWith("moleculer.config.js")) {
			console.log("Common dependency:", path.relative(path.resolve("."), fName));
			// Add it to all services
			broker.services.filter(svc => !!svc.__filename).forEach(svc => {
				if (!svc.__dependencies)
					svc.__dependencies = [];
				svc.__dependencies.push(fName);
			});
		}
	}

	if (mod.children && mod.children.length > 0) {
		mod.children.forEach(m => processModule(broker, m, service, service ? level + 1 : 0, mod));
	}
}

/**
 * Expose middleware
 */
module.exports = {
	// After broker started
	started(broker) {
		if (broker.options.hotReload)
			detectDependencyGraph(broker);
	}
};
