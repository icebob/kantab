const Laboratory = require("@moleculer/lab");

const port = Number(process.env.LABORATORY_PORT || 3212);

module.exports = {
	name: "laboratory",
	mixins:
		process.env.TEST_E2E || process.env.TEST_INT || process.env.NODE_ENV == "test"
			? undefined
			: [Laboratory.AgentService],

	metadata: {
		dockerCompose: {
			template: {
				expose: [port],
				ports: [`${port}:${port}`]
			}
		}
	},

	settings: {
		name: "KanTab",
		port: port,
		token: process.env.LABORATORY_TOKEN,
		apiKey: process.env.LABORATORY_APIKEY
	}
};
