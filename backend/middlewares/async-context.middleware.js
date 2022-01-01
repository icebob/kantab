const { AsyncLocalStorage } = require("async_hooks");

const asyncLocalStorage = new AsyncLocalStorage();

module.exports = {
	name: "AsyncContext",

	localAction(handler) {
		return ctx => asyncLocalStorage.run(ctx, () => handler(ctx));
	},

	serviceCreated(svc) {
		svc.getContext = () => asyncLocalStorage.getStore();
	}
};
