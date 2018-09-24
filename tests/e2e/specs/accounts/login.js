// https://docs.cypress.io/api/introduction/api.html

const mailtrap = require("../../util/mailtrap");

describe("Test login page with username & password", () => {
	//beforeEach(() => cy.visit("/login"));

	const baseUrl = Cypress.config("baseUrl");
	it("Check the login page", () => {
		cy.visit("/login");
		cy.contains("h4", "Sign In");
	});

	it("Try to login with wrong username", () => {
		cy.login("unknow", "test");
		cy.url().should("equal", `${baseUrl}/login`);
		cy.get(".alert.error").should("contain", "User not found!");
	});

	it("Try to login with wrong password", () => {
		cy.login("test", "wrongpass");
		cy.url().should("equal", `${baseUrl}/login`);
		cy.get(".alert.error").should("contain", "Wrong password!");
	});

	it("Login with correct data", () => {
		cy.login("test", "test");
		cy.url().should("equal", `${baseUrl}/`);
	});

	it("Logout", () => {
		cy.get("#nav a:nth-child(4)").click();

		cy.url().should("contain", `${baseUrl}/login`);
	});
});

describe("Test login page with passwordless", () => {
	//beforeEach(() => cy.visit("/login"));

	const baseUrl = Cypress.config("baseUrl");
	it("Login without password", () => {
		cy.login("test");
		cy.url().should("equal", `${baseUrl}/login`);
		cy.get(".alert.success").should("contain", "Magic link has been sent to 'test@kantab.io'. Use it to sign in.");

		cy.wait(2000);
		cy.get(".alert.success").then(() => {

			return mailtrap.getTokenFromMessage(null, "test@kantab.io", /passwordless\?token=(\w+)/g).then(({ token, messageID }) => {
				// Delete message
				return mailtrap.deleteMessage(null, messageID).then(() => {
					cy.visit(`/passwordless?token=${token}`);
					cy.url().should("equal", `${baseUrl}/`);
					cy.contains("h4", "Style guide");
				});
			});
		});
	});

});
