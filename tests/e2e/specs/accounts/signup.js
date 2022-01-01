// https://docs.cypress.io/api/introduction/api.html

let fakerator = require("fakerator")();

const EMAIL_PAUSE = 3000;

describe("Test signup page with password", () => {
	//beforeEach(() => cy.visit("/login"));

	const user = fakerator.entity.user();
	user.fullName = user.firstName + " " + user.lastName;

	const baseUrl = Cypress.config("baseUrl");
	it("Check the signup screen", () => {
		cy.visit("/signup");
		cy.contains("h3", "Sign Up");
	});

	it("Try too short password", () => {
		cy.signup(user.fullName, user.email, user.userName, "pass");
		cy.url().should("equal", `${baseUrl}/signup`);
		cy.get(".alert.bg-negative").should("be.visible");
	});

	it("Signup with correct data", () => {
		cy.signup(user.fullName, user.email, user.userName, user.password);
		cy.url().should("equal", `${baseUrl}/signup`);
		cy.get(".alert.bg-positive").should("contain", "Account created. Please activate now.");

		cy.wait(EMAIL_PAUSE);
		cy.get(".alert.bg-positive").then(() => {
			// Check token in sent email
			cy.request("POST", `${baseUrl}/api/maildev/getTokenFromMessage`, {
				recipient: user.email,
				pattern: "verify-account\\?token=(\\w+)"
			}).then(response => {
				expect(response.status).to.eq(200);
				expect(response.body).to.be.a("string");
				const token = response.body;

				cy.visit(`/verify-account?token=${token}`);
				cy.url().should("equal", `${baseUrl}/`);
				cy.get('#add-board-button');

				cy.request("POST", `${baseUrl}/api/maildev/deleteAllEmail`)
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
	user.fullName = user.firstName + " " + user.lastName;

	const baseUrl = Cypress.config("baseUrl");

	it("Signup with correct data", () => {
		cy.signup(user.fullName, user.email, user.userName);
		cy.url().should("equal", `${baseUrl}/signup`);
		cy.get(".alert.bg-positive").should("contain", "Account created. Please activate now.");

		cy.wait(EMAIL_PAUSE);
		cy.get(".alert.bg-positive").then(() => {
			// Check token in sent email
			cy.request("POST", `${baseUrl}/api/maildev/getTokenFromMessage`, {
				recipient: user.email,
				pattern: "verify-account\\?token=(\\w+)"
			}).then(response => {
				expect(response.status).to.eq(200);
				expect(response.body).to.be.a("string");
				const token = response.body;

				cy.visit(`/verify-account?token=${token}`);
				cy.url().should("equal", `${baseUrl}/`);
				cy.get('#add-board-button');

				cy.request("POST", `${baseUrl}/api/maildev/deleteAllEmail`)
			});
		});

		cy.logout();
	});

	it("Try login with password", () => {
		cy.login(user.email, user.password);
		cy.url().should("equal", `${baseUrl}/login`);
		cy.get(".alert.bg-negative").should("contain", "Please login without password");
	});

	it("Login with email", () => {
		cy.login(user.email);
		cy.url().should("equal", `${baseUrl}/login`);
		cy.get(".alert.bg-positive").should("contain", `Magic link has been sent to '${user.email}'`);

		cy.wait(EMAIL_PAUSE);
		cy.get(".alert.bg-positive").then(() => {
			// Check token in sent email
			cy.request("POST", `${baseUrl}/api/maildev/getTokenFromMessage`, {
				recipient: user.email,
				pattern: "passwordless\\?token=(\\w+)"
			}).then(response => {
				expect(response.status).to.eq(200);
				expect(response.body).to.be.a("string");
				const token = response.body;

				cy.visit(`/passwordless?token=${token}`);
				cy.url().should("equal", `${baseUrl}/`);
				cy.get('#add-board-button');

				cy.request("POST", `${baseUrl}/api/maildev/deleteAllEmail`)
			});
		});
		cy.logout();
	});

	it("Login with username", () => {
		cy.login(user.userName);
		cy.url().should("equal", `${baseUrl}/login`);
		cy.get(".alert.bg-positive").should("contain", `Magic link has been sent to '${user.email}'`);

		cy.wait(EMAIL_PAUSE);
		cy.get(".alert.bg-positive").then(() => {
			// Check token in sent email
			cy.request("POST", `${baseUrl}/api/maildev/getTokenFromMessage`, {
				recipient: user.email,
				pattern: "passwordless\\?token=(\\w+)"
			}).then(response => {
				expect(response.status).to.eq(200);
				expect(response.body).to.be.a("string");
				const token = response.body;

				cy.visit(`/passwordless?token=${token}`);
				cy.url().should("equal", `${baseUrl}/`);
				cy.get('#add-board-button');

				cy.request("POST", `${baseUrl}/api/maildev/deleteAllEmail`)
			});
		});
		cy.logout();
	});

});

