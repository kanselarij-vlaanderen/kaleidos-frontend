import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import DefaultQueryParamsMixin from 'ember-data-table/mixins/default-query-params';

export default class AgendasController extends Controller.extend(DefaultQueryParamsMixin) {
  @service currentSession;

  @tracked creatingNewSession = false;

  @action
  createNewSession() {
    this.creatingNewSession = true;
  }

  @action
  cancelNewSessionForm() {
    this.creatingNewSession = false;
  }

  @action
  successfullyAdded() {
    this.creatingNewSession = false;
    this.send('refreshRoute');
    this.transitionToRoute('agendas.overview');
  }
}
