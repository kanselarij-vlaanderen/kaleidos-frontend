/* eslint-disable no-undef */

// Commands
import dependency from '../../selectors/dependency.selectors';
import utils from '../../selectors/utils.selectors';

// ***********************************************

// Functions
/**
 * Select a date in the flatpickrCalendar
 * @memberOf Cypress.Chainable#
 * @name selectDate
 * @function
 * @param {String} year - The year that needs to be inserted in the datepicker
 * @param {String} month - the month that needs to be selected in the datepicker
 * @param {String} day - The day that needs to be selected in the datepicker
 * @param {int} index - The day that needs to be selected in the datepicker
 */
function selectDate(year, month, day, index) {
  cy.log('selectDate');
  let element;

  if (index !== undefined) {
    element = cy.get(utils.vlDatepicker).eq(index)
      .click();
    element.get(dependency.flatpickrMonthDropdownMonths).eq(index)
      .select(month);
    element.get(dependency.numInputWrapper).get(dependency.inputNumInputCurYear)
      .eq(index)
      .clear()
      .type(year, {
        delay: 300,
      });
    element.get(dependency.flatpickrDay).should('be.visible')
      .contains(day)
      .click();
  } else {
    element = cy.get(utils.vlDatepicker).click();
    element.get(dependency.flatpickrMonthDropdownMonths).select(month);
    element.get(dependency.numInputWrapper)
      .get(dependency.inputNumInputCurYear)
      .clear()
      .type(year, {
        delay: 300,
      });
    element.get(dependency.flatpickrDay).contains(day)
      .click();
  }
  cy.log('/selectDate');
}

/**
 * Validate the content of the dropdown
 * @memberOf Cypress.Chainable#
 * @name validateDropdownElements
 * @function
 * @param {int} elementIndex: index of the element that needs to be selected
 * @param {String} textContent: Text that need to be in the dropdown element
 */
function validateDropdownElements(elementIndex, textContent) {
  cy.log('validateDropdownElements');
  cy.get(dependency.emberPowerSelect.trigger).click();
  cy.get(dependency.emberPowerSelect.option).eq(elementIndex)
    .should('contain.text', textContent);
  cy.get(dependency.emberPowerSelect.option).eq(elementIndex)
    .scrollIntoView()
    .click();
  cy.log('/validateDropdownElements');
}

/**
 * @description Returns the current moment in Cypress
 * @name currentMoment
 * @memberOf Cypress.Chainable#
 * @function
 * @returns {moment.Moment} The current moment
 */
function currentMoment() {
  return Cypress.moment();
}

/**
 * @description returns the current time in unix timestamp
 * @name currentTimestamp
 * @memberOf Cypress.Chainable#
 * @function
 * @returns {number} The current time in unix timestamp
 */
function currentTimestamp() {
  return Cypress.moment().unix();
}

Cypress.Commands.add('selectDate', selectDate);
Cypress.Commands.add('validateDropdownElements', validateDropdownElements);

Cypress.Commands.add('currentMoment', currentMoment);
Cypress.Commands.add('currentTimestamp', currentTimestamp);
