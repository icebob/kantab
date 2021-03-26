"use strict";

module.exports = function (opts = {}) {
	return {
		methods: {
			async memoize(name, params, fn) {
				if (!this.broker.cacher) return fn();

				const key = this.broker.cacher.defaultKeygen(
					`${this.name}:memoize-${name}`,
					params,
					{}
				);

				let res = await this.broker.cacher.get(key);
				if (res) return res;

				res = await fn();
				this.broker.cacher.set(key, res, opts.ttl);

				return res;
			}
		}
	};
};
