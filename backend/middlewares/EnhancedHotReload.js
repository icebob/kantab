"use strict";

const fs = require("fs");
const chalk = require("chalk");
const path = require("path");
const _ = require("lodash");

const { clearRequireCache } = require("moleculer").Utils;

const cache = new Map();

/*
	TODO:
	- meg kell várni a következő ráfuttatással amíg a hotReload lefut
	  mert így hamarabb bejárja, pedig az előző service-t még le sem állította
	  és az újonnan bejött új függőségeket nem találja meg.
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
		broker.logger.info(chalk.bgMagenta.white.bold(`Reload ${needToReload.size} service(s)`));

		needToReload.forEach(svc => broker.hotReloadService(svc));
		needToReload.clear();

		// Recall processing (TODO: wait for hotReload)
		setTimeout(() => watchProjectFiles(broker), 2000);
	}, 500);


	prevProjectFiles.forEach((prevWatchItem, fName) => {
		// const relPath = path.relative(process.cwd(), fName);

		//if (!projectFiles.has(fName)) {
		//	broker.logger.info("  Remove unused dependency:", relPath);

		// Close previous watcher
		if (prevWatchItem.watcher) {
			prevWatchItem.watcher.close();
			prevWatchItem.watcher = null;
		}
		//}
	});

	broker.logger.info("");
	broker.logger.info(chalk.yellow.bold("Watching the following project files:"));
	projectFiles.forEach((watchItem, fName) => {
		const relPath = path.relative(process.cwd(), fName);
		if (watchItem.brokerRestart)
			broker.logger.info(`  ${relPath}: restart broker`);
		else if (watchItem.allServices)
			broker.logger.info(`  ${relPath}: reload all services`);
		else if (watchItem.services.length > 0)
			broker.logger.info(`  ${relPath}: reload ${watchItem.services.length} service(s):`, watchItem.services);

		if (watchItem.others.length > 0)
			broker.logger.info("    Others:", watchItem.others);

		watchItem.watcher = fs.watch(fName, async (eventType) => {
			const relPath = path.relative(process.cwd(), fName);
			broker.logger.info(chalk.magenta.bold(`The '${relPath}' file is changed. (Event: ${eventType})`));

			clearRequireCache(fName);

			if (watchItem.others.length > 0) {
				watchItem.others.forEach(f => clearRequireCache(f));
			}

			if (watchItem.brokerRestart) {
				/*broker.logger.info(chalk.bgMagenta.white.bold("Action: Stop all file watcher & restart broker..."));
				stopAllFileWatcher();
				broker.restart();
				*/

			} else if (watchItem.allServices) {
				broker.services.forEach(svc => {
					if (svc.__filename)
						needToReload.add(svc);
				});
				reloadServices();

			} else if (watchItem.services.length > 0) {
				broker.services.forEach(svc => {
					if (watchItem.services.indexOf(svc.fullName) !== -1)
						needToReload.add(svc);
				});
				reloadServices();
			}
		});
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
		others: []
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

	// Skip node_modules files, if there is parent project file
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
		if (!watchItem.services.includes(service.fullName))
			watchItem.services.push(service.fullName);

		watchItem.others = _.uniq([].concat(watchItem.others, parents || []));

	} else {
		if (parents) {
			const watchItem = getWatchItem(fName);
			watchItem.allServices = true;
			watchItem.others = _.uniq([].concat(watchItem.others, parents || []));
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
		if (broker.options.hotReload) {
			// Kick out the original service watcher
			broker.watchService = () => {};
		}
		/*broker.restart = async function() {
			broker.logger.info("Restarting ServiceBroker...");
			await broker.stop();
			await broker.start();
		}.bind(broker);*/
	},

	// After broker started
	started(broker) {
		if (broker.options.hotReload) {
			// Execute new watcher
			watchProjectFiles(broker);
		}
	}
};
