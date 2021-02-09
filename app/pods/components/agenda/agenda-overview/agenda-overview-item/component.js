import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { timeout } from 'ember-concurrency';
import {
  dropTask,
  task
} from 'ember-concurrency-decorators';
import { sortPieces } from 'fe-redpencil/utils/documents';

function createSubcaseLoader(target) {
  let shouldLoad = false;

  let maybeLoadSubcases = function() {
    setTimeout( () =>
      requestAnimationFrame( () =>
        setTimeout( () => {
          try {
            if( shouldLoad ) {
              target.doLoadSubcases();
            }
          } catch (e) {
            console.log("Component died before loading subcases");
          }
        }) ), 400 );
  };

  return {
    load() {
      shouldLoad = true;
      maybeLoadSubcases();
    },

    cancel() {
      shouldLoad = false;
    }
  };
}

export default class AgendaOverviewItem extends Component {
  /**
   *
   * @argument agendaitem
   * @argument isEditingOverview
   */

  @service store;
  @service sessionService;
  @service publicationService;
  @service router;
  @service('current-session') currentSessionService;

  @tracked agendaitemDocuments
  @tracked subcase;
  @tracked newsletterIsVisible;

  @tracked isShowingAllDocuments = false;

  constructor() {
    super(...arguments);
    this.subcaseLoader = createSubcaseLoader(this);
    this.agendaitemDocuments = [];
    this.loadDocuments.perform();
  }

  get documentsAreReleased() {
    return this.sessionService.currentSession.releasedDocuments > new Date();
  }

  get documentListSize() {
    return 20;
  }

  get limitedAgendaitemDocuments() {
    if (this.isShowingAllDocuments) {
      return this.agendaitemDocuments;
    }
    return this.agendaitemDocuments.slice(0, this.documentListSize);
  }

  get enableShowMore() {
    return this.agendaitemDocuments.length > this.documentListSize;
  }

  @task
  *startPublication() {
    const _case = yield this.args.agendaitem.get('case');
    const newPublication = yield this.publicationService.createNewPublication(0, _case.id);
    this.router.transitionTo('publications.publication.case', newPublication.id);
  }

  @action
  setFormalStatus(status) {
    this.args.setFormalStatus(status.uri);
  }

  @task
  *loadDocuments() {
    let pieces = yield this.args.agendaitem.pieces;
    pieces = pieces.toArray();
    const sortedPieces = sortPieces(pieces);
    this.agendaitemDocuments = sortedPieces;
  }

  async doLoadSubcases() {
    try {
      console.log("Loading subcases");
      const agendaActivity = await this.args.agendaitem.agendaActivity;
      if (agendaActivity) { // the approval agenda-item doesn't have agenda activity
        this.subcase = await agendaActivity.subcase;
      }
    } catch (e) {
      console.log("Component died during loading of subcases");
    }
  }


  @task
  *lazyLoad(task) {
    if (task.performCount === 0) {
      yield timeout(400);
      yield new Promise( (acc) =>
        requestAnimationFrame( async () => {
          await timeout(0);
          await task.perform();
          acc();
        } ) );
    }
  }

  @action
  cancelLazyLoad(task) {
    task.cancelAll();
  }

  @dropTask
  *lazyLoadSubcase() {
    yield this.lazyLoad.perform(this.loadSubcase);
  }

  @dropTask
  *loadSubcase() {
    const agendaActivity = yield this.args.agendaitem.agendaActivity;
    if (agendaActivity) { // the approval agenda-item doesn't have agenda activity
      this.subcase = yield agendaActivity.subcase;
    }
  }

  @dropTask
  *lazyLoadNewsletterVisibility() {
    yield this.lazyLoad.perform(this.loadNewsletterVisibility);
  }

  @dropTask
  *loadNewsletterVisibility() {
    const treatments = yield this.args.agendaitem.treatments;
    const treatment = treatments.firstObject;
    if (treatment) { // TODO: this is only the case for the first item of the agenda (approval, older data)
      const newsletterInfo = yield treatment.newsletterInfo;
      if (newsletterInfo) {
        this.newsletterIsVisible = newsletterInfo.inNewsletter;
      } else {
        this.newsletterIsVisible = false;
      }
    } else {
      this.newsletterIsVisible = false;
    }
  }

  @action
  toggleShowingAllDocuments() {
    this.isShowingAllDocuments = !this.isShowingAllDocuments;
  }
}
