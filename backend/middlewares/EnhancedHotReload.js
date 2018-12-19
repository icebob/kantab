"use strict";

const fs = require("fs");
const path = require("path");
const _ = require("lodash");

const { clearRequireCache } = require("moleculer").Utils;

const cache = new Map();

/*
	TODO:
	- a processModule már töltse is fel a dependencies object-et.
	- tárolja el, hogy ha változik miket kell cacheből törölni, melyik service-eket kell hotReload-olni, és kell-e broker restart-ot csinálni.
	- changes után ha megvolt az újratöltés, akkor megint be kéne járnia a modulokat, ugyanis elképzelhető, hogy új függőség jött be, vagy éppen tűnt el.
	  szóval ilyenkor törölni kéne a watch-olásokat és újra felvenni. Vagy maradhat a régi watch, de ha a fájl törlődik akkor a watcher-t is törölni kell.
	  Ha pedig új jön, akkor ahhoz új watch kell. Szóval a watcher-t a dependencies-be is lehetne tárolni. Újrafuttatásnál flag-el jelölni, hogy maradhat-e a watch.
	  Ha másodjára már nem lett hozzáadva, akkor a flag alapján a régi dependency-ket törölni watch-ot megszűntetni.
	- moleculer.config.js változásakor broker.restart
 */

/**
 * Detect service dependency graph & watch all dependent files & services.
 *
 * @param {ServiceBroker} broker
 */
function watchProjectFiles(broker) {

	// Read the main module
	const mainModule = process.mainModule;

	// Process the whole module tree
	processModule(broker, mainModule);

	// Collect all dependent files
	const dependencies = {};

	broker.services.forEach(svc => {
		if (Array.isArray(svc.__dependencies)) {
			svc.__dependencies.forEach(fName => {
				let item = dependencies[fName];
				if (!item) {
					item = {
						services: [],
						files: []
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
			broker.logger.info(`Clear '${fName}' cached module.`);
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
function processModule(broker, mod, service = null, level = 0, parents = null) {
	const fName = mod.filename;

	// Skip node_modules files
	if ((service || parents) && fName.indexOf("node_modules") !== -1)
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
			console.log(`\n${" ".repeat(level * 2)} SERVICE: ${service.name} -> ${relPath}`, "Parents: ", parents);
		else
			console.log(`${" ".repeat(level * 2)} ${relPath}`, "Parents: ", parents);

	} else {
		if (parents) {
			console.log("Common dependency:", path.relative(path.resolve("."), fName), "Parents: ", parents);
			// Add it to all services
			broker.services.filter(svc => !!svc.__filename).forEach(svc => {
				if (!svc.__dependencies)
					svc.__dependencies = [];
				svc.__dependencies.push(fName);
			});
		}
	}

	if (mod.children && mod.children.length > 0) {
		if (service) {
			parents = parents ? parents.concat([fName]) : [fName];
		} else if (fName.endsWith("moleculer.config.js")) {
			parents = [];
		} else if (parents) {
			parents.push(fName);
		}
		mod.children.forEach(m => processModule(broker, m, service, service ? level + 1 : 0, parents));
	}
}

/**
 * Expose middleware
 */
module.exports = {
	// After broker created
	created(broker) {
		broker.restart = async function() {
			broker.logger.info("Restarting ServiceBroker...");
			await broker.stop();
			await broker.start();
		}.bind(broker);
	},

	// After broker started
	started(broker) {
		if (broker.options.hotReload) {
			// Kick out the original service watcher
			broker.watchService = () => {};

			// Execute new watcher
			watchProjectFiles(broker);
		}
	}
};
