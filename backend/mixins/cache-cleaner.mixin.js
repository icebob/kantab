module.exports = function (eventNames) {
	const events = {};

	eventNames.forEach(name => {
		events[name] = function () {
			if (this.broker.cacher) {
				this.logger.debug(`Clear local '${this.fullName}' cache`);
				this.broker.cacher.clean(`${this.fullName}.**`);
			}
		};
	});

	return {
		events
	};
};
