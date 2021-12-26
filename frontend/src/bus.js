import mitt from "mitt";

const emitter = mitt();

const bus = {
	on: (...args) => emitter.on(...args),
	once: (...args) => emitter.once(...args),
	off: (...args) => emitter.off(...args),
	emit: (...args) => emitter.emit(...args),

	install: app => {
		app.config.globalProperties.$bus = bus;

		app.mixin({
			beforeMount() {
				const events = this.$options.events;
				if (events) {
					for (const event in events) {
						const fn = events[event].bind(this);
						events[event]._binded = fn;
						bus.on(event, fn);
					}
					// console.log("On all", emitter.all);
				}
			},

			beforeUnmount() {
				const events = this.$options.events;
				if (events) {
					for (const event in events) {
						if (events[event]._binded) {
							bus.off(event, events[event]._binded);
						}
					}
					// console.log("Off all", emitter.all);
				}
			}
		});
	}
};

export default bus;
