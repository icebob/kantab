"use strict";

const _ = require("lodash");
const Haikunator = require("haikunator");
const haikunator = new Haikunator();

module.exports = {
	command: "create-board",
	description: "Create a board",
	alias: ["cb"],
	options: [
		{
			option: "-u, --user <userID>",
			description: "User ID"
		},
		{
			option: "-t, --title <name>",
			description: "Title of board"
		},
		{
			option: "-l, --list <count>",
			description: "Number of lists"
		},
		{
			option: "-c, --card <count>",
			description: "Number of cards"
		}
	],
	async action(broker, args, { table, kleur, getBorderCharacters }) {
		const { options } = args;
		console.log(options);
		const board = await broker.call(
			"v1.boards.create",
			{
				title: options.title || haikunator.haikunate({ tokenLength: 3, delimiter: " " }),
				description: "This is a generated board"
			},
			{ meta: { userID: options.user, $repl: true } }
		);

		const lists = await broker.Promise.mapSeries(_.times(options.list || 10), i => {
			return broker.call(
				"v1.lists.create",
				{
					title: "List " + (i + 1),
					position: i + 1,
					board: board.id
				},
				{ meta: { userID: options.user, $repl: true } }
			);
		});
		let cards = [];

		await Promise.mapSeries(lists, async (list, j) => {
			const res = await broker.Promise.mapSeries(_.times(options.list || 50), i => {
				return broker.call(
					"v1.cards.create",
					{
						title: `Card ${j + 1}-${i + 1}`,
						position: i + 1,
						list: list.id
					},
					{ meta: { userID: options.user, $repl: true } }
				);
			});
			cards.push(...res);
		});

		console.log(board /*, lists, cards*/);
	}
};
