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
  cy.request({
    url: 'http://localhost:3000/api/authentications',
    method: 'POST',
    body: {
      data: {
        attributes: {
          email,
          password,
        }
      }
    }
  }).then((response) => {
    debugger;
    console.log(response.body.data.attributes.token);
    window.localStorage.setItem('ember_simple_auth-session', JSON.stringify({
      authenticated: {
        authenticator: "authenticator:simple",
        token: response.body.data.attributes.token,
        userId: "1"
      }
    }))
  })
});
