// https://docs.cypress.io/api/introduction/api.html

describe("Test login page with username & password", () => {
	//beforeEach(() => cy.visit("/login"));

	const baseUrl = Cypress.config("baseUrl");
	it("Check the login screen", () => {
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