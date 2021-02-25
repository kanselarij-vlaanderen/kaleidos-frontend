import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { alias } from '@ember/object/computed';

export default class AgendaitemTitles extends Component {
  classNames = ['auk-u-mb-8']; // @brenner-company: since this is a glimmer component, this can be removed?

  @alias('args.agendaitem.agendaActivity.subcase') subcase;

  @tracked showLoader = false;

  @service currentSession;

  @service publicationService;

  @service router;

  @action
  toggleIsEditingAction() {
    this.args.toggleIsEditing();
  }

  @action
  async startPublication() {
    this.showLoader = true;
    const _case = await this.subcase.get('case');
    const newPublicationNumber = await this.publicationService.getNewPublicationNextNumber();
    const newPublication = await this.publicationService.createNewPublication(newPublicationNumber, _case.id);
    this.showLoader = false;
    this.router.transitionTo('publications.publication.case', newPublication.id);
  }
}
