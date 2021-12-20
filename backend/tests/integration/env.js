const path = require("path");
const Runner = require("moleculer").Runner;
const kleur = require("kleur");

module.exports = function init() {
	const state = {
		broker: null,
		users: {},
		contexts: {},
		boards: {},
		lists: {},
		cards: {}
	};

	return {
		async setupEnv() {
			console.log(kleur.magenta().bold("Booting Moleculer project for integration tests..."));
			try {
				const runner = new Runner();
				const broker = await runner.start([
					process.argv[0],
					__filename,
					path.join(__dirname, "..", "..", "services", "**", "*.service.js")
				]);

				console.log(kleur.magenta().bold("Broker started. NodeID:"), broker.nodeID);

				// Disable verification
				await broker.call("v1.config.set", {
					key: "accounts.verification.enabled",
					value: false
				});
				// Disable mail sending
				await broker.call("v1.config.set", {
					key: "mail.enabled",
					value: false
				});

				state.broker = broker;

				return state;
			} catch (err) {
				console.error(err);
				process.exit(1);
			}
		},

		async tearDownEnv() {
			if (state.broker) await state.broker.stop();
		}
	};
};
