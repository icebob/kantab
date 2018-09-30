"use strict";

const _ 			= require("lodash");

module.exports = function(keys, opts) {
	const events = {};

	opts = _.defaultsDeep(opts, {
		propName: "config",
		objPropName: "configObj",
		configChanged: "configChanged",
		serviceName: "config",
		serviceVersion: 1
	});

	const eventHandler = function(payload) {
		this[opts.propName][payload.key] = payload.value;
		_.set(this[opts.objPropName], payload.key, payload.value);
		this.logger.debug("Configuration updated:", this[opts.propName]);

		if (_.isFunction(this[opts.configChanged])) {
			this[opts.configChanged].call(this, payload.key, payload.value, payload);
		}
	};

	keys.forEach(key => events[`config.${key}.changed`] = eventHandler);

	const schema = {
		dependencies: [
			{ name: opts.serviceName, version: opts.serviceVersion }
		],

		events,

		async started() {
			if (!_.isObject(this[opts.propName]))
				this[opts.propName] = {};
			if (!_.isObject(this[opts.objPropName]))
				this[opts.objPropName] = {};

			if (keys.length > 0) {
				const items = await this.broker.call("v1.config.get", { key: keys });
				if (items) {
					items.forEach(item => {
						this[opts.propName][item.key] = item.value;
						_.set(this[opts.objPropName], item.key, item.value);
					});
				}
			}

			this.logger.debug("Configuration loaded:", this[opts.propName]);
		}
	};

	return schema;
};
