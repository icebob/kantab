// https://docs.cypress.io/api/introduction/api.html

const mailtrap = require("../../util/mailtrap");

const EMAIL_PAUSE = 3000;

describe("Test forgot password flow", () => {
	//beforeEach(() => cy.visit("/login"));

	const baseUrl = Cypress.config("baseUrl");
	it("Check the forgot page", () => {
		cy.visit("/forgot-password");
		cy.contains("h4", "Forgot Password");
	});

	it("Try with wrong email", () => {
		cy.forgotPassword("chuck.norris@notfound.me");

		cy.url().should("equal", `${baseUrl}/forgot-password`);
		cy.get(".alert.error").should("contain", "Email is not registered.");
	});

	it("Try with correct email", () => {
		cy.forgotPassword("test@kantab.io");

		cy.url().should("equal", `${baseUrl}/forgot-password`);
		cy.get(".alert.success").should("contain", "E-mail sent.");

		cy.wait(EMAIL_PAUSE);
		cy.get(".alert.success").then(() => {

			return mailtrap.getTokenFromMessage(null, "test@kantab.io", /reset-password\?token=(\w+)/g).then(({ token, messageID }) => {
				// Delete message
				return mailtrap.deleteMessage(null, messageID).then(() => {
					cy.resetPassword(token, "newpassword");
					cy.url().should("equal", `${baseUrl}/`);
					cy.contains("h4", "Style guide");

					cy.logout();
				});
			});
		});
	});

	it("Try login with old password", () => {
		cy.login("test@kantab.io", "pass");
		cy.url().should("equal", `${baseUrl}/login`);
		cy.get(".alert.error").should("contain", "Wrong password!");
	});

	it("Login with new password", () => {
		cy.login("test@kantab.io", "newpassword");
		cy.url().should("equal", `${baseUrl}/`);
		cy.contains("h4", "Style guide");
		cy.logout();
	});
});
