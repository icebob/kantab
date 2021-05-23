"use strict";

const _ = require("lodash");

module.exports = {
	command: "rest",
	description: "List REST API aliases",
	options: [
		{
			option: "-f, --filter <match>",
			description: "filter aliases (e.g.: 'users')"
		}
	],
	async action(broker, args, { table, kleur, getBorderCharacters }) {
		const { options } = args;
		//console.log(options);
		const aliases = await broker.call("api.listAliases");

		const data = [[kleur.bold("Method"), kleur.bold("Path"), kleur.bold("Action")]];

		let hLines = [];

		aliases.sort((a, b) => a.fullPath.localeCompare(b.fullPath));

		let lastRoutePath;

		aliases.forEach(item => {
			if (
				options.filter &&
				!item.fullPath.toLowerCase().includes(options.filter.toLowerCase())
			)
				return;

			// Draw a separator line
			if (lastRoutePath && item.routePath != lastRoutePath) hLines.push(data.length);
			lastRoutePath = item.routePath;

			data.push([item.methods, item.fullPath, item.actionName ? item.actionName : "-"]);
		});

		const tableConf = {
			border: _.mapValues(getBorderCharacters("honeywell"), char => kleur.gray(char)),
			columns: {
				0: { alignment: "right" },
				1: { alignment: "left" }
			},
			drawHorizontalLine: (index, count) =>
				index == 0 || index == 1 || index == count || hLines.indexOf(index) !== -1
		};

		console.log(table(data, tableConf));
	}
};
