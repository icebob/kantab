// https://docs.cypress.io/api/introduction/api.html

const mailtrap = require("../../util/mailtrap");
let fakerator = require("fakerator")();

const EMAIL_PAUSE = 3000;

describe("Test signup page with password", () => {
	//beforeEach(() => cy.visit("/login"));

	const user = fakerator.entity.user();

	const baseUrl = Cypress.config("baseUrl");
	it("Check the signup screen", () => {
		cy.visit("/signup");
		cy.contains("h4", "Sign Up");
	});

	it("Try too short password", () => {
		cy.signup(user.firstName, user.lastName, user.email, user.userName, "pass");
		cy.url().should("equal", `${baseUrl}/signup`);
		cy.get(".alert.error").should("be.visible");
	});

	it("Signup with correct data", () => {
		cy.signup(user.firstName, user.lastName, user.email, user.userName, user.password);
		cy.url().should("equal", `${baseUrl}/signup`);
		cy.get(".alert.success").should("contain", "Account created. Please activate now.");

		cy.wait(EMAIL_PAUSE);
		cy.get(".alert.success").then(() => {

			return mailtrap.getTokenFromMessage(null, user.email, /verify-account\?token=(\w+)/g).then(({ token, messageID }) => {
				// Delete message
				return mailtrap.deleteMessage(null, messageID).then(() => {
					cy.visit(`/verify-account?token=${token}`);
					cy.url().should("equal", `${baseUrl}/`);
					cy.contains("h4", "Style guide");
				});
			});
		});

		cy.logout();

	});

	it("Login with email & password", () => {
		cy.login(user.email, user.password);
		cy.url().should("equal", `${baseUrl}/`);
		cy.logout();
	});

	it("Login with username & password", () => {
		cy.login(user.userName, user.password);
		cy.url().should("equal", `${baseUrl}/`);
		cy.logout();
	});
});

describe("Test signup page with passwordless account", () => {
	//beforeEach(() => cy.visit("/login"));

	const user = fakerator.entity.user();

	const baseUrl = Cypress.config("baseUrl");

	it("Signup with correct data", () => {
		cy.signup(user.firstName, user.lastName, user.email, user.userName);
		cy.url().should("equal", `${baseUrl}/signup`);
		cy.get(".alert.success").should("contain", "Account created. Please activate now.");

		cy.wait(EMAIL_PAUSE);
		cy.get(".alert.success").then(() => {

			return mailtrap.getTokenFromMessage(null, user.email, /verify-account\?token=(\w+)/g).then(({ token, messageID }) => {
				// Delete message
				return mailtrap.deleteMessage(null, messageID).then(() => {
					cy.visit(`/verify-account?token=${token}`);
					cy.url().should("equal", `${baseUrl}/`);
					cy.contains("h4", "Style guide");
				});
			});
		});

		cy.logout();

	});

	it("Try login with password", () => {
		cy.login(user.email, user.password);
		cy.url().should("equal", `${baseUrl}/login`);
		cy.get(".alert.error").should("contain", "Please login without password");
	});

	it("Login with email", () => {
		cy.login(user.email);
		cy.url().should("equal", `${baseUrl}/login`);
		cy.get(".alert.success").should("contain", `Magic link has been sent to '${user.email}'`);

		cy.wait(EMAIL_PAUSE);
		cy.get(".alert.success").then(() => {

			return mailtrap.getTokenFromMessage(null, user.email, /passwordless\?token=(\w+)/g).then(({ token, messageID }) => {
				// Delete message
				return mailtrap.deleteMessage(null, messageID).then(() => {
					cy.visit(`/passwordless?token=${token}`);
					cy.url().should("equal", `${baseUrl}/`);
					cy.contains("h4", "Style guide");
				});
			});
		});
		cy.logout();
	});

	it("Login with username", () => {
		cy.login(user.userName);
		cy.url().should("equal", `${baseUrl}/login`);
		cy.get(".alert.success").should("contain", `Magic link has been sent to '${user.email}'`);

		cy.wait(EMAIL_PAUSE);
		cy.get(".alert.success").then(() => {

			return mailtrap.getTokenFromMessage(null, user.email, /passwordless\?token=(\w+)/g).then(({ token, messageID }) => {
				// Delete message
				return mailtrap.deleteMessage(null, messageID).then(() => {
					cy.visit(`/passwordless?token=${token}`);
					cy.url().should("equal", `${baseUrl}/`);
					cy.contains("h4", "Style guide");
				});
			});
		});
		cy.logout();
	});


});

