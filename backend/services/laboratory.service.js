const Laboratory = require("@moleculer/lab");

const port = Number(process.env.LABORATORY_PORT || 3212);

module.exports = {
	name: "laboratory",
	mixins: [Laboratory.AgentService],

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
