/* global context, it, cy,beforeEach */
// / <reference types="Cypress" />

import settings from '../../../../selectors/settings.selectors';
import dependency from '../../../../selectors/dependency.selectors';
import utils from '../../../../selectors/utils.selectors';

context('Settings page tests', () => {
  let govermentDomains = [];

  function insertData() {
    return ['Cultuur, jeugd, sport & media',
      'Economie, wetenschap & innovatie',
      'Financieën & begroting',
      'Internationaal Vlaanderen',
      'Kanselarij & bestuur',
      'Landbouw & visserij',
      'Mobiliteit & openbare werken',
      'Omgeving',
      'Onderwijs & vorming',
      'Welzijn, vollksgezondheid & gezin',
      'Werk & sociale economie'
    ];
  }

  beforeEach(() => {
    govermentDomains = insertData();
    cy.server();
    cy.login('Admin');
    cy.get(utils.mHeader.settings).click();
    cy.url().should('include', 'instellingen/overzicht');
  });

  it('Should open the model behind manage goverment domains', () => {
    cy.get(settings.overview.manageGovermentDomains).click();
    cy.get(utils.vlModal.dialogWindow).should('be.visible')
      .should('contain', 'Beleidsdomeinen beheren');
  });

  it('Should open the model behind manage goverment domains and close it', () => {
    cy.get(settings.overview.manageGovermentDomains).click();
    cy.get(utils.vlModal.dialogWindow).should('be.visible');
    cy.get(utils.vlModal.close).click();
    cy.get(utils.vlModal.dialogWindow).should('not.be.visible');
  });

  it('Should open the dropdown in the modal and see each item', () => {
    cy.get(settings.overview.manageGovermentDomains).click();
    cy.get(utils.vlModal.dialogWindow).find(dependency.emberPowerSelect.trigger)
      .click();
    cy.get(dependency.emberPowerSelect.option).should('have.length', govermentDomains.length);

    for (let index = 0; index < govermentDomains.length; index++) {
      cy.get(dependency.emberPowerSelect.option).eq(index)
        .scrollIntoView()
        .should('contain.text', govermentDomains[index]);
    }
  });

  it('Should open the dropdown in the modal and selecting the first element should show advanced modal', () => {
    cy.get(settings.overview.manageGovermentDomains).click();
    cy.get(utils.vlModal.dialogWindow).should('be.visible');
    cy.get(dependency.emberPowerSelect.trigger).click();
    cy.get(dependency.emberPowerSelect.option).should('have.length', govermentDomains.length);
    cy.get(dependency.emberPowerSelect.option).eq(0)
      .should('contain.text', govermentDomains[0]);
    cy.get(dependency.emberPowerSelect.option).eq(0)
      .click();
    cy.get(dependency.emberPowerSelect.selectedItem).should('contain.text', govermentDomains[0])
      .wait(200);
    cy.get(settings.modelManager.add).should('be.visible');
    cy.get(settings.modelManager.edit).should('be.visible');
    cy.get(settings.modelManager.delete).should('be.visible');
  });

  it('Should open the dropdown in the modal and selecting the each element should show advanced modal with that element in the dropdown span', () => {
    cy.get(settings.overview.manageGovermentDomains).click();
    cy.get(utils.vlModal.dialogWindow).should('be.visible');
    for (let index = 0; index < govermentDomains.length; index++) {
      cy.validateDropdownElements(index, govermentDomains[index]);
    }
  });

  it('Should open the modal and add a new item in the list', () => {
    cy.route('POST', '/government-domains').as('postDomains');

    cy.get(settings.overview.manageGovermentDomains).click();
    cy.get(settings.modelManager.add).click();
    cy.get(utils.vlFormInput).type('Andere zaken');
    cy.get(utils.vlModalFooter.save).click();
    cy.wait('@postDomains');
    cy.get(dependency.emberPowerSelect.trigger).click();
    cy.get(dependency.emberPowerSelect.option).should('have.length', govermentDomains.length + 1);
  });

  it('Should open the modal, select the new domain and edit it', () => {
    cy.route('PATCH', '/government-domains/**').as('patchDomains');

    cy.get(settings.overview.manageGovermentDomains).click();
    cy.get(utils.vlModal.dialogWindow).should('be.visible');
    cy.get(dependency.emberPowerSelect.trigger).click();
    cy.get(dependency.emberPowerSelect.option).should('have.length.greaterThan', 0);
    cy.get(dependency.emberPowerSelect.option).eq(0)
      .should('contain.text', 'Andere zaken');
    cy.get(dependency.emberPowerSelect.option).eq(0)
      .click();
    cy.get(settings.modelManager.edit).click();
    cy.get(utils.vlFormInput).clear();
    cy.get(utils.vlFormInput).type('Test Input');
    cy.get(utils.vlModalFooter.save).click();
    cy.wait('@patchDomains');
    cy.get(dependency.emberPowerSelect.trigger).click();
    cy.get(dependency.emberPowerSelect.option).should('have.length.greaterThan', 0);
    cy.get(dependency.emberPowerSelect.option).should('contain.text', 'Test Input');
    cy.get(dependency.emberPowerSelect.option).should('not.contain.text', 'Andere zaken');
  });
  // TODO-settings delete this new domain
});
