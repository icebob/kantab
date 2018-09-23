"use strict";

const axios = require("axios").create({
	baseURL: "https://mailtrap.io/api/v1/",
	headers: {
		"Content-Type": "application/json",
		"Api-Token": Cypress.env("MAILTRAP_API")
	}
});


function getMessages(inboxID, email) {
	inboxID = inboxID || Cypress.env("MAILTRAP_INBOX");

	return axios.get(`/inboxes/${inboxID}/messages`).then(res => {
		return res.data.filter(msg => email == null || msg.to_email == email);
	});
}

function getTokenFromMessage(inboxID, email, re) {
	inboxID = inboxID || Cypress.env("MAILTRAP_INBOX");

	return getMessages(null, email).then(messages => {
		if (messages.length < 1)
			throw new Error("Passwordless email not received!");

		const msg = messages[0];

		// Get the last email body
		return axios.get(`/inboxes/${inboxID}/messages/${msg.id}/body.html`).then(({ data }) => {
			const match = re.exec(data);
			if (!match)
				throw new Error("Token missing from email! " + data);

			console.log(match, data);
			return { token: match[1], messageID: msg.id };
		});
	}).catch(err => {
		console.log(err);
		throw err;
	});
}

function deleteMessage(inboxID, messageID) {
	inboxID = inboxID || Cypress.env("MAILTRAP_INBOX");

	return axios.delete(`/inboxes/${inboxID}/messages/${messageID}`);
}

function cleanInbox(inboxID) {
	inboxID = inboxID || Cypress.env("MAILTRAP_INBOX");

	return axios.patch(`/inboxes/${inboxID}/clean`);
}

/*
(async function() {
	try {
		//console.log(await getMessages(null, "test@kantab.io"));
		//console.log(await getTokenFromMessage(null, "test@kantab.io", /passwordless\?token=(\w+)/g));
		//console.log(await deleteMessage(null, "936046392"));
		console.log(await cleanInbox());
	} catch(err) {
		console.error(err);
	}
})();
*/

module.exports = {
	getMessages,
	getTokenFromMessage,
	cleanInbox,
	deleteMessage
};
