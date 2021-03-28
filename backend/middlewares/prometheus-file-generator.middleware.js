const _ = require("lodash");
const fs = require("fs");
const path = require("path");

module.exports = function (opts) {
	opts = _.defaultsDeep(opts, {
		filename: "./monitoring/prometheus/targets.json",
		jobName: "kantab",
		port: 3030
	});

	/**
	 * Generates an updated target list.
	 * More info: https://prometheus.io/docs/prometheus/latest/configuration/configuration/#file_sd_config
	 */
	async function regenerateTargets(broker) {
		let nodeList = await broker.registry.getNodeList({ onlyAvailable: true });

		// Skip CLI clients
		nodeList = nodeList.filter(node => !node.id.startsWith("cli-"));

		const targets = nodeList.map(node => ({
			labels: { job: opts.jobName || node.hostname, nodeID: node.id },
			targets: [`${node.hostname}:${opts.port}`]
		}));

		try {
			fs.writeFileSync(path.resolve(opts.filename), JSON.stringify(targets, null, 2), "utf8");
			broker.logger.debug("Successfully updated Prometheus target file");
		} catch (error) {
			broker.logger.warn("Broker couldn't write to Prometheus' target file");
		}
	}

	return {
		name: "PrometheusFileGenerator",

		async started(broker) {
			broker.localBus.on("$node.connected", () => regenerateTargets(broker));
			broker.localBus.on("$node.disconnected", () => regenerateTargets(broker));

			regenerateTargets(broker);
		}
	};
};
