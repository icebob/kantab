"use strict";

const _ = require("lodash");

module.exports = {
	command: "boards",
	description: "List KanTab boards",
	alias: ["b"],
	options: [
		{
			option: "-u, --user <userID>",
			description: "User ID"
		}
	],
	async action(broker, args, { table, kleur, getBorderCharacters }) {
		const { options } = args;
		console.log(options);
		const boards = await broker.call(
			"v1.boards.find",
			{
				sort: "title",
				populate: ["owner"],
				scope: !!options.user
			},
			{ meta: { userID: options.user, $repl: true } }
		);

		const data = [
			[
				kleur.bold("ID"),
				kleur.bold("Title"),
				kleur.bold("Owner"),
				kleur.bold("Public"),
				kleur.bold("Archived")
			]
		];

		let hLines = [];

		boards.forEach(board => {
			data.push([
				board.id,
				board.title,
				board.owner.fullName,
				board.public ? kleur.magenta().bold("YES") : "Private",
				board.archived ? kleur.cyan().bold("YES") : "No"
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
