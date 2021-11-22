"use strict";

const _ = require("lodash");
const kleur = require("kleur");

function getStatusString(board) {
	if (board.deletedAt) return kleur.bgRed().white().bold("Deleted");
	return kleur.green().bold("Active");
}

module.exports = {
	command: "lists",
	description: "List KanTab board lists",
	alias: ["l"],
	options: [
		{
			option: "-u, --user <userID>",
			description: "User ID"
		},
		{
			option: "-b, --board <boardID>",
			description: "Board ID"
		}
	],
	async action(broker, args, { table, kleur, getBorderCharacters }) {
		const { options } = args;
		try {
			//console.log(options);
			const lists = await broker.call(
				"v1.lists.find",
				{
					sort: "title",
					populate: ["board"],
					scope: ["notDeleted"],
					board: options.board,
					query: { board: options.board }
				},
				{ meta: { userID: options.user, $repl: true } }
			);

			const data = [
				[kleur.bold("ID"), kleur.bold("Title"), kleur.bold("Board"), kleur.bold("Status")]
			];

			let hLines = [];

			lists.forEach(list => {
				data.push([list.id, list.title, list.board.title, getStatusString(list)]);
			});

			const tableConf = {
				border: _.mapValues(getBorderCharacters("honeywell"), char => kleur.gray(char)),
				columns: {
					3: { alignment: "center" }
				},
				drawHorizontalLine: (index, count) =>
					index == 0 || index == 1 || index == count || hLines.indexOf(index) !== -1
			};

			console.log(table(data, tableConf));
		} catch (err) {
			broker.logger.error(err);
		}
	}
};
