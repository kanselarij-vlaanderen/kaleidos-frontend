/* global cy, Cypress */
// / <reference types="Cypress" />

import publication from '../../selectors/publication.selectors';
import dependency from '../../selectors/dependency.selectors';
import auk from '../../selectors/auk.selectors';

// ***********************************************
// Functions

/**
 * @description Goes to the publication overview and creates a new publication.
 * @name createPublication
 * @memberOf Cypress.Chainable#
 * @function
 * @param {string} shortTitle The short title for the case
 * @param {string} longTitle The long title for the case
 * @returns {Promise<String>} the id of the created publication-flow
 */
function createPublication(shortTitle, longTitle) {
  cy.log('createPublication');
  cy.route('POST', '/cases').as('createNewCase');
  cy.route('POST', '/publication-flows').as('createNewPublicationFlow');

  cy.visit('publicaties');
  cy.get(publication.newPublicationButton).click();

  cy.get(auk.modal.container).as('publicationModal')
    .within(() => {
      cy.get(publication.newPublicationModal.publicationShortTitleTextarea).click()
        .clear()
        .type(shortTitle);
      cy.get(publication.newPublicationModal.publicationLongTitleTextarea).click()
        .clear()
        .type(longTitle);
    });

  let publicationFlowId;

  cy.get('@publicationModal').within(() => {
    cy.get(publication.newPublicationModal.createButton).click()
      .wait('@createNewCase', {
        timeout: 20000,
      })
      .wait('@createNewPublicationFlow', {
        timeout: 20000,
      })
      .then((res) => {
        publicationFlowId = res.responseBody.data.id;
        // Check if we transitioned to dossier page of the publication-flow
        cy.url().should('contain', `publicaties/${publicationFlowId}/dossiers`);
      })
      .then(() => new Cypress.Promise((resolve) => {
        resolve({
          publicationFlowId,
        });
      }));
  });
  // TODO-publication this cypress promise needs to be the last command executed, move cy.log higher
  // Check if we transitioned to dossier page of the publication-flow
  cy.get(publication.publicationCase.casePanel);
  cy.log('/createPublication');
}

/**
 * @description Opens the document add dialog and adds each file in the files array
 * @name addPublicationDocuments
 * @memberOf Cypress.Chainable#
 * @function
 * @param {{folder: String, fileName: String, fileExtension: String, [newFileName]: String, [fileType]: String}[]} files
 */
function addPublicationDocuments(files) {
  cy.log('addPublicationDocuments');
  cy.route('POST', 'pieces').as('createNewPiece');
  cy.route('POST', 'document-containers').as('createNewDocumentContainer');

  // TODO This part can be reused in future tests

  cy.get(auk.modal.container).as('fileUploadDialog');

  files.forEach((file, index) => {
    cy.get('@fileUploadDialog').within(() => {
      if (file.extension === 'docx') {
        cy.uploadFile(file.folder, file.fileName, file.fileExtension, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      } else {
        cy.uploadFile(file.folder, file.fileName, file.fileExtension);
      }
      cy.get('.vl-uploaded-document', {
        timeout: 10000,
      }).should('have.length', index + 1)
        .eq(index)
        .within(() => {
          if (file.newFileName) {
            cy.get('.auk-form-group').eq(0)
              .within(() => {
                cy.get('.auk-input').clear()
                  .type(file.newFileName);
              });
          }
        });
    });

    // TODO will need refactoring if the current uploader changes to a new design for publication
    if (file.fileType) {
      cy.get('@fileUploadDialog').within(() => {
        cy.get('.vl-uploaded-document').eq(index)
          .within(() => {
            cy.get('input[type="radio"]').should('exist'); // the radio buttons should be loaded before the within or the .length returns 0
            cy.get('.auk-radio-list')
              .within(($t) => {
                if ($t.find(`input[type="radio"][value="${file.fileType}"]`).length) {
                  cy.get('input[type="radio"]').check(file.fileType, {
                    force: true,
                  }); // CSS has position:fixed, which cypress considers invisible
                } else {
                  cy.get('input[type="radio"][value="Andere"]').check({
                    force: true,
                  });
                  cy.get(dependency.emberPowerSelect.trigger)
                    .click()
                    .parents('body')
                    .within(() => {
                      cy.get(dependency.emberPowerSelect.option, {
                        timeout: 5000,
                      }).should('exist')
                        .then(() => {
                          cy.contains(file.fileType).click(); // Match is not exact, ex. fileType "Advies" yields "Advies AgO" instead of "Advies"
                        });
                    });
                }
              });
          });
      });
    }
  });
  cy.get('@fileUploadDialog').within(() => {
    cy.get(auk.modal.footer).within(() => {
      // TODO Click the save button in your modal footer
    });
  });

  cy.wait('@createNewPiece', {
    timeout: 24000,
  });
  cy.wait('@createNewDocumentContainer', {
    timeout: 24000,
  });
  // patching of model case no longer happens, piece.case is set instead
  cy.get('@fileUploadDialog').should('not.exist');
  cy.log('/addPublicationDocuments');
}

// ***********************************************
// Commands
Cypress.Commands.add('createPublication', createPublication);
Cypress.Commands.add('addPublicationDocuments', addPublicationDocuments);
