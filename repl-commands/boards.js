"use strict";

const _ = require("lodash");
const kleur = require("kleur");

function getStatusString(board) {
	if (board.deletedAt) return kleur.bgRed().white().bold("Deleted");
	if (board.archived) return kleur.magenta().bold("Archived");
	return kleur.green().bold("Active");
}

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
				populate: ["owner", "members"],
				scope: !!options.user
			},
			{ meta: { userID: options.user, $repl: true } }
		);

		const data = [
			[
				kleur.bold("ID"),
				kleur.bold("Title"),
				kleur.bold("Owner"),
				kleur.bold("Members"),
				kleur.bold("Public"),
				kleur.bold("Status")
			]
		];

		let hLines = [];

		boards.forEach(board => {
			data.push([
				board.id,
				board.title,
				board.owner.fullName,
				board.members.map(member => member.fullName),
				board.public ? kleur.magenta().bold("YES") : "Private",
				getStatusString(board)
			]);
		});

		const tableConf = {
			border: _.mapValues(getBorderCharacters("honeywell"), char => kleur.gray(char)),
			columns: {
				3: { alignment: "center" },
				4: { alignment: "center" }
			},
			drawHorizontalLine: (index, count) =>
				index == 0 || index == 1 || index == count || hLines.indexOf(index) !== -1
		};

		console.log(table(data, tableConf));
	}
};
