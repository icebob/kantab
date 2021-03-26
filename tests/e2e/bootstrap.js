"use strict";

const kleur = require("kleur");

module.exports = broker => {

	console.log(kleur.magenta().bold("Starting Cypress for End-to-End testing..."));

	// Redirect Cypress logs to Moleculer logger
	/*
	const logger = broker.getLogger("CYPRESS");
	const stream = require("stream");
	const logStream = new stream.Stream();

	logStream.writable = true;
	logStream.write = data => logger.info(kleur.bgMagenta().bold().white("CYPRESS:"), data.toString("utf8").trim());
	*/

	// Execute Cypress
	const execa = require("execa");
	const args = [];
	if (process.env.TEST_E2E == "run")
		args.push("open"/*, "--record", "--key", "920a1001-30cb-4471-8d5d-066843b6a9a3"*/);
	else
		args.push("open");
	const runner = execa(require.resolve("cypress/bin/cypress"), args, { stdin: "inherit", stdout: "inherit" });
	//runner.stdout.pipe(logStream);

	//runner.on("exit", async () => await broker.stop());
	runner.on("error", async () => await broker.stop());
	runner.on("exit", async code => {
		console.log("Cypress exited", code);
		await broker.stop();
		process.exit(code);
	});
};
