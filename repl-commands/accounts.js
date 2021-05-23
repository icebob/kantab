"use strict";

const C = require("../backend/constants");

const _ = require("lodash");
const kleur = require("kleur");

function getStatusString(sta) {
	switch (sta) {
		case C.STATUS_ACTIVE:
			return kleur.green().bold("Active");
		case C.STATUS_INACTIVE:
			return kleur.yellow().bold("Inactive");
		case C.STATUS_DELETED:
			return kleur.green().bold("Deleted");
		default:
			return sta;
	}
}

module.exports = {
	command: "accounts",
	description: "List KanTab accounts",
	alias: ["users", "u"],
	// options: [
	// 	{
	// 		option: "-f, --filter <match>",
	// 		description: "filter aliases (e.g.: 'users')"
	// 	}
	// ],
	async action(broker, args, { table, kleur, getBorderCharacters }) {
		//const { options } = args;
		//console.log(options);
		const users = await broker.call(
			"v1.accounts.find",
			{ sort: "username" },
			{ meta: { $repl: true } }
		);

		const data = [
			[
				kleur.bold("ID"),
				kleur.bold("Username"),
				kleur.bold("Full name"),
				kleur.bold("E-mail"),
				kleur.bold("Roles"),
				kleur.bold("Verified"),
				kleur.bold("Status")
			]
		];

		let hLines = [];

		users.forEach(user => {
			// if (
			// 	args.options.filter &&
			// 	!item.fullPath.toLowerCase().includes(args.options.filter.toLowerCase())
			// )
			// 	return;

			data.push([
				user.id,
				user.username,
				user.fullName,
				user.email,
				user.roles,
				user.verified ? kleur.green().bold("✔") : kleur.yellow().bold("✖"),
				getStatusString(user.status)
			]);
		});

		const tableConf = {
			border: _.mapValues(getBorderCharacters("honeywell"), char => kleur.gray(char)),
			columns: {
				5: { alignment: "center" },
				6: { alignment: "center" }
			},
			drawHorizontalLine: (index, count) =>
				index == 0 || index == 1 || index == count || hLines.indexOf(index) !== -1
		};

		console.log(table(data, tableConf));
	}
};
