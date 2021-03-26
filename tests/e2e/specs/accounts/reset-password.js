// https://docs.cypress.io/api/introduction/api.html

const mailtrap = require("../../util/mailtrap");
let fakerator = require("fakerator")();

const EMAIL_PAUSE = 3000;

describe("Test forgot password flow", () => {

	const user = fakerator.entity.user();
	user.fullName = user.firstName + " " + user.lastName;
	const baseUrl = Cypress.config("baseUrl");

	it("Create a temp user", () => {
		cy.signup(user.fullName, user.email, user.userName);
		cy.get(".alert.success").should("contain", "Account created. Please activate now.");

		cy.wait(EMAIL_PAUSE);
		cy.get(".alert.success").then(() => {

			return mailtrap.getTokenFromMessage(null, user.email, /verify-account\?token=(\w+)/g).then(({ token, messageID }) => {
				// Delete message
				return mailtrap.deleteMessage(null, messageID).then(() => {
					cy.visit(`/verify-account?token=${token}`);
					cy.url().should("equal", `${baseUrl}/`);
					cy.contains("h4", "Home");
				});
			});
		});

		cy.logout();
	});

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
		cy.forgotPassword(user.email);

		cy.url().should("equal", `${baseUrl}/forgot-password`);
		cy.get(".alert.success").should("contain", "E-mail sent.");

		cy.wait(EMAIL_PAUSE);
		cy.get(".alert.success").then(() => {

			return mailtrap.getTokenFromMessage(null, user.email, /reset-password\?token=(\w+)/g).then(({ token, messageID }) => {
				// Delete message
				return mailtrap.deleteMessage(null, messageID).then(() => {
					cy.resetPassword(token, "newpassword");
					cy.url().should("equal", `${baseUrl}/`);
					cy.contains("h4", "Home");

					cy.logout();
				});
			});
		});
	});

	it("Try login with old password", () => {
		cy.login(user.email, user.password);
		cy.url().should("equal", `${baseUrl}/login`);
		cy.get(".alert.error").should("contain", "Wrong password!");
	});

	it("Login with new password", () => {
		cy.login(user.email, "newpassword");
		cy.url().should("equal", `${baseUrl}/`);
		cy.contains("h4", "Home");
		cy.logout();
	});

	after(() => mailtrap.cleanInbox());
});
