"use strict";

const axios = require("axios").create({
	baseURL: "https://mailtrap.io/api/v1/",
	headers: {
		"Content-Type": "application/json",
		"Api-Token": process.env.MAILTRAP_API
	}
});

async function getMessages(inboxID, email) {
	inboxID = inboxID || process.env.MAILTRAP_INBOX;

	const res = await axios.get(`/inboxes/${inboxID}/messages`);
	return res.data.filter(msg => email == null || msg.to_email == email);
}

async function getTokenFromMessage(inboxID, email, re) {
	inboxID = inboxID || process.env.MAILTRAP_INBOX;

	const messages = await getMessages(null, email);

	if (messages.length < 1)
		throw new Error("Passwordless email not received!");

	const msg = messages[0];

	// Get the last email body
	const res2 = await axios.get(`/inboxes/${inboxID}/messages/${msg.id}/body.html`);
	const body = res2.data;

	const match = re.exec(body);
	if (!match)
		throw new Error("Token missing from email! " + body);

	return match[1];
}

async function deleteMessage(inboxID, messageID) {
	inboxID = inboxID || process.env.MAILTRAP_INBOX;

	await axios.delete(`/inboxes/${inboxID}/messages/${messageID}`);
}

async function cleanInbox(inboxID) {
	inboxID = inboxID || process.env.MAILTRAP_INBOX;

	await axios.patch(`/inboxes/${inboxID}/clean`);
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
