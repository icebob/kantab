"use strict";

"use strict";

const path = require("path");
const Runner = require("moleculer").Runner;
const kleur = require("kleur");

//jest.setTimeout(60000);

describe("Integration test", () => {
	let broker = null;
	beforeAll(async () => {
		console.log(kleur.magenta().bold("Booting Moleculer project for integration tests..."));

		try {
			const runner = new Runner();
			broker = await runner.start([
				process.argv[0],
				__filename,
				path.join(__dirname, "..", "..", "services", "**", "*.service.js")
			]);

			console.log(kleur.magenta().bold("Broker started. NodeID:"), broker.nodeID);
		} catch (err) {
			console.error(err);
			process.exit(1);
		}
	}, 60000);

	afterAll(async () => {
		if (broker) await broker.stop();
	}, 10000);

	it("should pass", async () => {
		const res = await broker.call("v1.boards.list");
		expect(res).toEqual({ page: 1, pageSize: 10, rows: [], total: 0, totalPages: 0 });
	});
});
