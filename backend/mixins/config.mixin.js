"use strict";

const _ 			= require("lodash");

module.exports = function(keys) {
	const events = {};

	const eventHandler = function(payload) {
		this.config[payload.key] = payload.value;
		_.set(this.configObj, payload.key, payload.value);
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
			this.configObj = {};

			const items = await this.broker.call("v1.config.get", { key: keys });
			if (items) {
				items.forEach(item => {
					this.config[item.key] = item.value;
					_.set(this.configObj, item.key, item.value);
				});
			}

			this.logger.debug("Configuration loaded:", this.config);
			this.logger.info("Configuration loaded:", this.configObj);
		}
	};

	return schema;
};
