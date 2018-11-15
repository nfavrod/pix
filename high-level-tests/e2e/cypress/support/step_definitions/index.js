given('je vais sur Pix', () => {
  cy.visit('/');
});

given('je suis connecté à Pix', () => {
  cy.login('userpix1@example.net', 'pix123');
});

when(`je clique sur {string}`, (label) => {
  cy.contains(label).click();
});
