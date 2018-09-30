// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add("login", (email, password) => {
	cy.visit("/login");

	if (email)
		cy.get("input[name='email']").clear().type(email);
	else
		cy.get(".input[name='email']").clear();

	if (password)
		cy.get("input[name='password']").clear().type(password);
	else
		cy.get("input[name='password']").clear();

	cy.get("button[type=submit]").click();
});

Cypress.Commands.add("logout", () => {
	cy.get("#nav a:nth-child(5)").click();

	cy.url().should("contain", `${Cypress.config("baseUrl")}/login`);
});

Cypress.Commands.add("signup", (firstName, lastName, email, username, password) => {
	cy.visit("/signup");

	if (firstName)
		cy.get("input[name='firstName']").clear().type(firstName);
	else
		cy.get("input[name='firstName']").clear();

	if (lastName)
		cy.get("input[name='lastName']").clear().type(lastName);
	else
		cy.get("input[name='lastName']").clear();

	if (email)
		cy.get("input[name='email']").clear().type(email);
	else
		cy.get("input[name='email']").clear();

	if (username)
		cy.get("input[name='username']").clear().type(username);
	else
		cy.get("input[name='username']").clear();

	if (password)
		cy.get("input[name='password']").clear().type(password);
	else
		cy.get("input[name='password']").clear();

	cy.get("button[type=submit]").click();
});

Cypress.Commands.add("forgotPassword", (email) => {
	cy.visit("/forgot-password");

	if (email)
		cy.get("input[name='email']").clear().type(email);
	else
		cy.get(".input[name='email']").clear();

	cy.get("button[type=submit]").click();
});

Cypress.Commands.add("resetPassword", (token, password) => {
	cy.visit(`/reset-password?token=${token}`);

	if (password)
		cy.get("input[name='password']").clear().type(password);
	else
		cy.get("input[name='password']").clear();

	cy.get("button[type=submit]").click();
});
