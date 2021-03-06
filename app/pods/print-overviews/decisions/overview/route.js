import Route from '@ember/routing/route';
import { inject } from '@ember/service';
import { hash } from 'rsvp';
import {
  parseDraftsAndGroupsFromAgendaitems,
  sortByPriority
} from 'frontend-kaleidos/utils/agendaitem-utils';

export default Route.extend({
  agendaService: inject(),
  type: 'decisions',
  allowEmptyGroups: true,

  queryParams: {
    definite: {
      refreshModel: false,
    },
  },

  async model() {
    const session = await this.modelFor('print-overviews');
    const agenda = await this.modelFor(`print-overviews.${this.type}`);
    const agendaitems = await this.store.query('agendaitem', {
      filter: {
        agenda: {
          id: agenda.get('id'),
        },
      },
      include: 'mandatees,treatments',
      sort: 'priority',
    });

    const announcements = agendaitems.filter((agendaitem) => agendaitem.showAsRemark);

    const {
      draftAgendaitems, groupedAgendaitems,
    } = await parseDraftsAndGroupsFromAgendaitems(agendaitems);

    await this.agendaService.groupAgendaitemsOnGroupName(draftAgendaitems);

    const groupsArray = sortByPriority(groupedAgendaitems, true);

    return hash({
      currentAgenda: agenda,
      groups: groupsArray,
      agendaitems: draftAgendaitems.sortBy('priority'),
      announcements: announcements.sortBy('priority'),
      meeting: session,
    });
  },
});
