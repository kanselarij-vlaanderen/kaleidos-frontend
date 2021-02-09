import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { A } from '@ember/array';
import { task } from 'ember-concurrency-decorators';

class AgendaitemGroup {
  @tracked mandatees;
  @tracked agendaitems;

  constructor(mandatees, firstAgendaItem) {
    this.mandatees = mandatees;
    this.agendaitems = A([firstAgendaItem]);
    this.sortedMandatees = A(this.mandatees.sortBy('priority').toArray());
    this.sortedMandateeIdsString = this.sortedMandatees.mapBy('id').join();
  }

  async itemBelongsToThisGroup(agendaitem) {
    const mandatees = A((await agendaitem.get('mandatees')).toArray());
    mandatees.sortBy('priority');
    return mandatees.mapBy('id').join() === this.sortedMandateeIdsString; // Compare by value
  }
}

export default class AgendaOverview extends Component {
  /**
   * @argument notas
   * @argument announcements
   * @argument currentAgenda
   */
  @service sessionService;
  @service agendaService;

  @service('current-session') currentSessionService;

  dragHandleClass = '.ki-drag-handle-2';

  @tracked isEditingOverview = null;
  @tracked showLoader = null;
  @tracked groupedNotas;
  @tracked isDesignAgenda;

  constructor() {
    super(...arguments);
    this.groupNotasOnGroupName.perform(this.regularNotas);
    this.determineIfDesignAgenda.perform();
  }

  get approvalNotas() {
    return this.args.notas.filterBy('isApproval', true);
  }

  get regularNotas() {
    return this.args.notas.filterBy('isApproval', false);
  }

  get isDraggingEnabled() {
    return this.currentSessionService.isEditor && this.isDesignAgenda;
  }

  @action
  async setAgendaItemFormalStatus(agendaitem, formalStatusUri) {
    this.showLoader = true;
    agendaitem.formallyOk = formalStatusUri;
    await agendaitem
      .save()
      .catch(() => {
        this.toaster.error();
      })
      .finally(() => {
        this.showLoader = false;
      });
  }

  @action
  toggleIsEditingOverview() {
    this.isEditingOverview = !this.isEditingOverview;
  }

  @task
  *groupNotasOnGroupName(agendaitems) {
    const agendaitemsArray = agendaitems.toArray();
    const agendaitemGroups = [];
    let currentAgendaitemGroup;
    for (const agendaitem of agendaitemsArray) {
      // yield new Promise((acc) => requestAnimationFrame(acc));
      yield new Promise((acc) => setTimeout(acc,0));
      if (currentAgendaitemGroup && (yield currentAgendaitemGroup.itemBelongsToThisGroup(agendaitem))) {
        currentAgendaitemGroup.agendaitems.pushObject(agendaitem);
      } else {
        // const mandatees = A(yield agendaitem.get('mandatees').toArray());
        // mandatees.sortBy('priority');
        currentAgendaitemGroup = new AgendaitemGroup(yield agendaitem.get('mandatees'), agendaitem);
        agendaitemGroups.push(currentAgendaitemGroup);
      }
    }
    this.groupedNotas = agendaitemGroups;
  }

  @task
  *determineIfDesignAgenda() {
    const agendaStatus = yield this.args.currentAgenda.status;
    this.isDesignAgenda = agendaStatus.isDesignAgenda;
  }
}
