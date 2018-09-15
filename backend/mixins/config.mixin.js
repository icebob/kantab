"use strict";

const _ 			= require("lodash");

module.exports = function(keys) {
	const events = {};

	const eventHandler = function(payload) {
		this.config[payload.key] = payload.value;
		this.logger.debug("Configuration updated:", this.config);

		if (_.isFunction(this.configChanged)) {
			this.configChanged.call(this, payload.key, payload.value, payload);
		}
	};

	keys.forEach(key => events[`config.${key}.changed`] = eventHandler);

	const schema = {
		dependencies: [
			{ name: "config", version: 1 }
		],

		events,

		async started() {
			this.config = {};

			const items = await this.broker.call("v1.config.get", { key: keys });
			if (items) {
				items.forEach(item => this.config[item.key] = item.value);
			}

			this.logger.debug("Configuration loaded:", this.config);
		}
	};

	return schema;
};
