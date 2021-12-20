"use strict";

const _ = require("lodash");

async function checkResponse(promise, expected) {
	const res = await promise;
	expect(res).toEqual(expected);

	return res;
}

async function checkError(promise, errorName) {
	try {
		await promise;
	} catch (err) {
		if (typeof errorName === "string") {
			//if (err.name != errorName) console.log(err);
			expect(err.name).toBe(errorName);
		} else if (_.isObject(errorName)) {
			Object.keys(errorName).forEach(key => {
				expect(err[key]).toBe(errorName[key]);
			});
		}
	}
}

async function checkBoardVisibility(fn, params, responses) {
	for (const user of Object.keys(responses)) {
		const res = responses[user];
		if (res.data) {
			await checkResponse(fn(user, params), res.data);
		} else if (res.error) {
			await checkError(fn(user, params), res.error);
		}
	}
}

function listResponse(rows) {
	return {
		page: 1,
		pageSize: 10,
		rows,
		total: rows.length,
		totalPages: 1
	};
}

module.exports = {
	checkResponse,
	checkError,
	checkBoardVisibility,
	listResponse
};
