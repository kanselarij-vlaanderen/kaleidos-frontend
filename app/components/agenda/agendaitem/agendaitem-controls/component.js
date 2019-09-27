import Component from '@ember/component';
import { computed } from '@ember/object';
import moment from 'moment';
import { inject } from '@ember/service';
import isAuthenticatedMixin from 'fe-redpencil/mixins/is-authenticated-mixin';

export default Component.extend( isAuthenticatedMixin, {
  store: inject(),
  sessionService: inject(),
  agendaService: inject(),
  currentAgenda: null,
  agendaitem: null,
  lastDefiniteAgenda: null,

  currentMeeting: computed('currentAgenda.createdFor', function() {
    return this.currentAgenda.get('createdFor');
  }),

  meetings: computed('currentMeeting', function() {
    const currentMeetingDate = this.currentMeeting.get('plannedStart')
    const dateOfToday = moment(currentMeetingDate).utc().format();
    const dateInTwoWeeks = moment().utc().add(6, 'weeks').format();

    return this.store.query('meeting', {
      filter: {
        ':gt:planned-start': dateOfToday,
        ':lte:planned-start': dateInTwoWeeks,
        'is-final': false
      },
      sort: 'planned-start'
    })
  }),

  isPostPonable: computed('sessionService.agendas.@each', function() {
    return this.get('sessionService.agendas').then(agendas => {
      if (agendas && agendas.get('length') > 1) {
        return true;
      } else {
        return false;
      }
    })
  }),

  isDeletable: computed(
    'agendaitem.subcase',
    'agendaitem.subcase.agendaitems',
    'currentAgenda.name',
    async function() {
      const currentAgendaName = await this.get('currentAgenda.name');
      const agendaitemSubcase = await this.get('agendaitem.subcase');
      const agendaitems = await this.get('agendaitem.subcase.agendaitems');
      if (currentAgendaName && currentAgendaName !== "Ontwerpagenda") {
        return false;
      } else if (agendaitemSubcase) {
        if (agendaitems && agendaitems.length > 1) {
          return false
        } else {
          return true;
        }
      }
    }),

  async deleteItem(agendaitem) {
    const id = agendaitem.get('id');
    const itemToDelete = await this.store.findRecord('agendaitem', agendaitem.get('id'));
    const subcase = await itemToDelete.get('subcase');

    if (subcase) {
      const phases = await subcase.get('phases');
      await Promise.all(phases.map(async phase => {
        await phase.destroyRecord();
      }));

      const otherItems = await subcase.get('agendaitems');
      await Promise.all(otherItems.map(async item => {
        await item.destroyRecord();
      }));

      await subcase.set('requestedForMeeting', null);
      await subcase.set('consulationRequests', []);
      await subcase.set('agendaitems', []);
      await subcase.save();
      this.set('sessionService.selectedAgendaItem', null);
      this.refreshRoute(id);
    } else {

      await itemToDelete.destroyRecord()
      this.set('sessionService.selectedAgendaItem', null);
      this.refreshRoute(id);
    }

  },

  actions: {
    showOptions() {
      this.toggleProperty('showOptions');
    },

    async postponeAgendaItem(agendaitem, meetingToPostponeTo) {
      agendaitem.set('retracted', true);

      const postPonedObject = this.store.createRecord('postponed', {
        agendaitem: agendaitem,
        meeting: meetingToPostponeTo
      });

      if (meetingToPostponeTo) {
        const subcase = await agendaitem.get('subcase');
        const agenda = await meetingToPostponeTo.get('latestAgenda');
        if (agenda.get('name') == 'Ontwerpagenda' && subcase) {
          await this.agendaService.createNewAgendaItem(agenda, subcase);
          await agenda.hasMany('agendaitems').reload();
        }
      }

      postPonedObject.save().then(postponedTo => {
        agendaitem.set('postponed', postponedTo);
      });

      await agendaitem.save();
      await agendaitem.reload();
    },

    async advanceAgendaitem() {
      const agendaitem = await this.store.findRecord('agendaitem', this.agendaitem.get('id'));
      if (agendaitem && agendaitem.retracted) {
        agendaitem.set('retracted', false);
      }
      const postponedTo = await agendaitem.get('postponedTo');
      if (agendaitem && postponedTo) {
        await postponedTo.destroyRecord();
      }
      await agendaitem.save();
      await agendaitem.reload();
    },

    toggleIsVerifying() {
      this.toggleProperty('isVerifying')
    },

    async tryToDeleteItem(agendaitem) {
      if (await this.isDeletable) {
        this.deleteItem(agendaitem)
      } else if (this.isAdmin) {
        this.toggleProperty('isVerifying')
      }
    },

    verifyDelete(agendaitem) {
      this.deleteItem(agendaitem)
    }
  }
});
