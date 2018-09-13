"use strict";

const _ 			= require("lodash");

module.exports = function(keys) {
	const events = {};

	const eventHandler = function(payload) {
		this.logger.info(`Config ${payload.key} value is changed. Updating...`, payload.value);
		this.config[payload.key] = payload.value;

		this.logger.info("Configuration updated:", this.config);
	};

	keys.forEach(key => events[`config.${key}.changed`] = eventHandler);

	const schema = {
		dependencies: [
			{ name: "config", version: 1 }
		],

		events,

		async started() {
			this.config = {};

			const items = await this.broker.call("v1.config.mget", { keys });
			if (items) {
				items.forEach(item => this.config[item.key] = item.value);
			}

			this.logger.info("Configuration loaded:", this.config);
		}
	};

	return schema;
};
