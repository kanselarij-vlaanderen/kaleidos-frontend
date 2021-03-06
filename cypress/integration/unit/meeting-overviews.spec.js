/* global context, before, it, cy, beforeEach, afterEach */
// / <reference types="Cypress" />

context('Test print overviews', () => {
  const beslissingen = '/overzicht/5DD7CDA58C70A70008000001/beslissingen/5DD7CDA58C70A70008000002/agendapunten';
  const persAgenda = '/overzicht/5DD7CDA58C70A70008000001/persagenda/5DD7CDA58C70A70008000002/agendapunten';

  before(() => {
    cy.server();
    cy.login('Admin');
  });

  beforeEach(() => {
    cy.server();
    cy.login('Admin');
  });

  afterEach(() => {
    cy.logout();
  });

  // TODO assert something? also use the actions from the actions menu from agenda to ensure both visit and action go to the same place?

  it('should visit beslissingen print overview', () => {
    cy.visit(beslissingen);
    cy.wait(1500);
  });

  it('should visit persAgenda print overview', () => {
    cy.visit(persAgenda);
    cy.wait(1500);
  });
});
