// https://docs.cypress.io/api/introduction/api.html

describe("Test login page with username & password", () => {
	//beforeEach(() => cy.visit("/login"));

	const baseUrl = Cypress.config("baseUrl");
	it("Check the login page", () => {
		cy.visit("/login");
		cy.contains("h3", "Sign In");
	});

	it("Try to login with wrong username", () => {
		cy.login("unknow", "test");
		cy.url().should("equal", `${baseUrl}/login`);
		cy.get(".alert.error").should("contain", "Account is not registered.");
	});

	it("Try to login with wrong password", () => {
		cy.login("test", "wrongpass");
		cy.url().should("equal", `${baseUrl}/login`);
		cy.get(".alert.error").should("contain", "Wrong password");
	});

	it("Login with correct data", () => {
		cy.login("test", "test");
		cy.url().should("equal", `${baseUrl}/`);
	});

	it("Logout", () => {
		cy.get("header #link-logout").click();

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

			cy.request("POST", `${baseUrl}/api/maildev/getTokenFromMessage`, {
				recipient: "test@kantab.io",
				pattern: "passwordless\\?token=(\\w+)"
			}).then(response => {
				expect(response.status).to.eq(200);
				expect(response.body).to.be.a("string");
				const token = response.body;

				cy.visit(`/passwordless?token=${token}`);
				cy.url().should("equal", `${baseUrl}/`);
				cy.contains("h3", "My boards");

				cy.request("POST", `${baseUrl}/api/maildev/deleteAllEmail`)
			});
		});
	});
});
