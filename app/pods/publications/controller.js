import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class PublicationsController extends Controller {
  @service publicationService;
  @service('-routing') routing;

  @tracked isShowingPublicationModal = false; // createPublicationModal ? more accurate
  @tracked hasError = false;
  @tracked numberIsAlreadyUsed = false;
  @tracked isCreatingPublication = false;

  @tracked
  publication = {
    number: null,
    shortTitle: null,
    longTitle: null,
  };

  get getError() {
    return this.hasError;
  }

  get getClassForGroupNumber() {
    if (this.numberIsAlreadyUsed || (this.hasError && (!this.publication.number || this.publication.number < 1))) {
      return 'auk-form-group--error';
    }
    return null;
  }

  get getClassForGroupShortTitle() {
    if (this.hasError && (!this.publication.shortTitle || this.publication.shortTitle < 1)) {
      return 'auk-form-group--error';
    }
    return null;
  }

  get shouldShowPublicationHeader() {
    return !this.routing.currentRouteName.startsWith('publications.publication');
  }

  @action
  async isPublicationNumberAlreadyTaken() {
    const isPublicationNumberTaken = await this.publicationService.publicationNumberAlreadyTaken(this.publication.number);
    if (isPublicationNumberTaken) {
      this.numberIsAlreadyUsed = true;
      this.hasError = true;
    } else {
      this.numberIsAlreadyUsed = false;
      this.hasError = false;
    }
  }

  @action
  async createNewPublication() {
    const isPublicationNumberTaken = await this.isPublicationNumberAlreadyTaken();

    if (isPublicationNumberTaken || !this.publication.number || this.publication.number.length < 1 || !this.publication.shortTitle || this.publication.shortTitle.length < 1) {
      this.hasError = true;
    } else {
      this.hasError = false;
    }

    if (!this.hasError) {
      this.isCreatingPublication = true;
      const newPublication = await this.publicationService.createNewPublication(this.publication.number, false, this.publication.longTitle, this.publication.shortTitle);
      this.closePublicationModal();
      this.transitionToRoute('publications.publication', newPublication.get('id'));
    }
  }

  @action
  closePublicationModal() {
    this.isShowingPublicationModal = false;
    this.isCreatingPublication = false;
    this.resetPublication();
  }

  @action
  showNewPublicationModal() {
    this.isShowingPublicationModal = true;
  }

  resetPublication() {
    this.publication = {
      number: null,
      shortTitle: null,
      longTitle: null,
    };
    this.hasError = false;
  }
}
