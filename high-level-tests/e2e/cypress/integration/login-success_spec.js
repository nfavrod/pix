describe('Login to Pix', function() {
  beforeEach(function() {
    // reset and seed the database prior to every test
    cy.exec('npm run db:reloadDB');
  });

  it('should loggin in Pix Aile account', function() {
    const userTest = {
      email: 'userpix1@example.net',
      password: 'pix123'
    };

    // visit homepage
    cy.visit('/');

    // type user login data
    cy.get('input[type=email]').type(userTest.email);
    cy.get('input[type=password]').type(userTest.password);

    // click on submit button
    cy.get('.signin-form__submit_button').click();

    // check the page
    cy.url().should('include', '/compte');
    cy.get('.logged-user-name').should((userName) => {
      expect(userName.text()).to.contains('Pix Aile');
    });
    cy.get('.profile-banner__title').should((userName) => {
      expect(userName.text()).to.contains('Bienvenue');
    });

  });
});
