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

let projectFiles = new Map();
let prevProjectFiles = new Map();

/**
 * Detect service dependency graph & watch all dependent files & services.
 *
 * @param {ServiceBroker} broker
 */
function watchProjectFiles(broker) {

	cache.clear();
	prevProjectFiles = projectFiles;
	projectFiles = new Map();

	// Read the main module
	const mainModule = process.mainModule;

	// Process the whole module tree
	processModule(broker, mainModule);

	const needToReload = new Set();

	const reloadServices = _.debounce(() => {
		needToReload.forEach(svc => broker.hotReloadService(svc));
		needToReload.clear();

		//Recall processing
		watchProjectFiles(broker);
	}, 500);

	broker.logger.info("Watching the following project files:");
	projectFiles.forEach((watchItem, fName) => {
		const relPath = path.relative(process.cwd(), fName);
		if (watchItem.brokerRestart)
			broker.logger.info(`  ${relPath}: restart broker`);
		else if (watchItem.allServices)
			broker.logger.info(`  ${relPath}: reload all services`);
		else if (watchItem.services.length > 0)
			broker.logger.info(`  ${relPath}: reload ${watchItem.services.length} service(s)`);

		if (watchItem.others)
			broker.logger.info("    Others:", watchItem.others);

		watchItem.watcher = fs.watch(fName, async (eventType) => {
			broker.logger.info(`The '${fName}' is changed. (Type: ${eventType})`);

			clearRequireCache(fName);

			if (watchItem.others) {
				watchItem.others.forEach(f => clearRequireCache(f));
			}

			if (watchItem.brokerRestart) {
				broker.logger.info("Stop all file watcher & restart broker...");
				stopAllFileWatcher();
				broker.restart();

			} else if (watchItem.allServices) {
				broker.logger.info(`  ${fName}: reload all services`);
				broker.services.forEach(svc => {
					if (svc.__filename)
						needToReload.add(svc);
				});
				reloadServices();

			} else if (watchItem.services.length > 0) {
				broker.logger.info(`  ${fName}: reload ${watchItem.services.length} service(s)`);
				broker.services.forEach(svc => {
					if (watchItem.services.indexOf(svc.fullName) !== -1)
						needToReload.add(svc);
				});
				reloadServices();
			}
		});
	});

	prevProjectFiles.forEach((prevWatchItem, fName) => {
		const relPath = path.relative(process.cwd(), fName);

		if (!projectFiles.has(fName)) {
			broker.logger.info("  Remove unused dependency:", relPath);

			// Close previous watcher
			if (prevWatchItem.watcher) {
				prevWatchItem.watcher.close();
				prevWatchItem.watcher = null;
			}
		}
	});
}

function stopAllFileWatcher() {
	projectFiles.forEach((watchItem) => {
		if (watchItem.watcher) {
			watchItem.watcher.close();
			watchItem.watcher = null;
		}
	});
}

function getWatchItem(fName) {
	let watchItem = projectFiles.get(fName);
	if (watchItem)
		return watchItem;

	watchItem = {
		services: [],
		allServices: false,
		brokerRestart: false,
		others: null
	};
	projectFiles.set(fName, watchItem);

	return watchItem;
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

	if (!service) {
		service = broker.services.find(svc => svc.__filename == fName);
	}

	if (service) {
		const watchItem = getWatchItem(fName);
		watchItem.services.push(service.fullName);
		watchItem.others = parents;
		watchItem.prev = false;

	} else {
		if (parents) {
			const watchItem = getWatchItem(fName);
			watchItem.allServices = true;
			watchItem.others = parents;
			watchItem.prev = false;
		}
	}

	if (mod.children && mod.children.length > 0) {
		if (service) {
			parents = parents ? parents.concat([fName]) : [fName];
		} else if (fName.endsWith("moleculer.config.js")) {
			parents = [];
			// const watchItem = getWatchItem(fName);
			// watchItem.brokerRestart = true;
			// watchItem.prev = false;
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
		/*broker.restart = async function() {
			broker.logger.info("Restarting ServiceBroker...");
			await broker.stop();
			await broker.start();
		}.bind(broker);*/
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
