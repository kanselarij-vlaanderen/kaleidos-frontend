import Controller from '@ember/controller';
import {
  action,
  set
} from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';

export default class CaseController extends Controller {
  @service publicationService;

  @tracked isViaCouncilOfMinisters;

  @tracked showLoader = false;
  @tracked contactPersons;
  @tracked personModalOpen = false;
  @tracked organizations;
  @tracked showAddOrganisationModal = false;
  @tracked inputOrganization = '';

  @tracked
  contactPerson = {
    firstName: '',
    lastName: '',
    email: '',
    organization: null,
  };

  @tracked
  contactPersonsView = {
    size: 50,
    page: 0,
    sort: '',
  };

  /**
   * ZONE FOR TTHE CONTACT PERSONS
   */
  @action
  onFirstNameChanged(event) {
    this.contactPerson.firstName = event.target.value;
  }

  @action
  onLastNameChanged(event) {
    this.contactPerson.lastName = event.target.value;
  }

  @action
  onEmailChanged(event) {
    this.contactPerson.email = event.target.value;
  }

  @action
  showContactPersonModal() {
    this.personModalOpen = true;
  }

  @action
  closeContactPersonModal() {
    this.personModalOpen = false;
    this.contactPerson.organization = null;
  }

  /**
   * ZONE FOR THE ORGANIZATIONS
   */
  get allOrganizations() {
    return this.organizations;
  }

  @action
  customPowerSelectSearchFunction(searchTerm, event) {
    // Just because we can.
    return event.results.filter((result) => result.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }

  @action
  async addOrganisation() {
    this.showLoader = true;
    const newOrganization = this.store.createRecord('organization', {
      name: this.inputOrganization,
    });
    await newOrganization.save();
    this.organizations.pushObject(newOrganization);
    this.inputOrganization = '';
    this.showAddOrganisationModal = false;
    this.showLoader = false;
  }

  @action
  openAddOrganisationModal() {
    this.showAddOrganisationModal = true;
  }

  @action
  closeAddOrganisationModal() {
    this.inputOrganization = '';
    this.showAddOrganisationModal = false;
  }

  @action
  selectOrganization(selections, event) {
    // Return all available organizations
    set(event, 'selected', selections);
    this.contactPerson.organization = selections;
  }

  get selectedOrganizations() {
    return this.contactPerson.organization;
  }

  @action
  async addNewContactPerson() {
    this.showLoader = true;
    const contactPerson =  await this.store.createRecord('contact-person', this.contactPerson);
    await contactPerson.save();
    await this.publicationService.linkContactPersonToPublication(this.model.id, contactPerson);
    this.contactPerson.organization = null;
    this.personModalOpen = false;
    this.showLoader = false;
  }

  @action
  async deleteContactPerson(contactPerson) {
    this.showLoader = true;
    await contactPerson.destroyRecord();
    this.showLoader = false;
  }
}
