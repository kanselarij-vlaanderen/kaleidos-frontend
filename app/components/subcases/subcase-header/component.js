import Component from '@ember/component';
import { inject } from '@ember/service';
import { computed } from '@ember/object';
import moment from 'moment';
import isAuthenticatedMixin from 'fe-redpencil/mixins/is-authenticated-mixin';

export default Component.extend(isAuthenticatedMixin, {
  store: inject(),
  agendaService: inject(),
  router: inject(),
  classNames: ['vlc-page-header'],
  isAssigningToOtherAgenda: false,
  isAssigningToOtherCase: false,
  promptDeleteCase: false,
  isShowingOptions: false,
  isLoading: false,
  isAssigning: false,
  subcase: null,
  caseToDelete: null,

  canPropose: computed('subcase.{requestedForMeeting,hasAgendaItem,isPostponed}', 'isAssigningToOtherAgenda', async function () {
    const { isAssigningToOtherAgenda, isLoading } = this;
    const subcase = await this.get('subcase');
    const requestedForMeeting = await subcase.get('requestedForMeeting');
    const hasAgendaItem = await subcase.get('hasAgendaItem');

    if (hasAgendaItem || requestedForMeeting || isAssigningToOtherAgenda || isLoading) {
      return false;
    }

    return true;
  }),

  canDelete: computed('canPropose', 'isAssigningToOtherAgenda', async function () {
    const canPropose = await this.get('canPropose');
    const { isAssigningToOtherAgenda } = this;

    if (canPropose && !isAssigningToOtherAgenda) {
      return true;
    }

    return false;
  }),

  meetings: computed('store', function () {
    const dateOfToday = moment().utc().subtract(1, 'weeks').format();
    const dateInTwoWeeks = moment().utc().add(6, 'weeks').format();

    return this.store.query('meeting', {
      filter: {
        ':gte:planned-start': dateOfToday,
        ':lte:planned-start': dateInTwoWeeks,
        'is-final': false
      },
      sort: 'planned-start'
    })
  }),

  async deleteSubcase(subcase) {
    const itemToDelete = await this.store.findRecord('subcase', subcase.get('id'), { reload: true });
    const newsletterInfo = await itemToDelete.get('newsletterInfo');
    if (newsletterInfo) {
      await newsletterInfo.destroyRecord();
    }
    await itemToDelete.destroyRecord();
  },

  async triggerDeleteCaseDialog() {
    this.set('promptDeleteCase', true);
  },

  navigateToSubcaseOverview(caze) {
    this.router.transitionTo('cases.case.subcases', caze.id);
  },

  toggleAllPropertiesBackToDefault() {
    this.set('isAssigningToOtherAgenda', false);
    this.set('isDeletingSubcase', false);
    this.set('selectedSubcase', null);
    this.set('subcaseToDelete', null);
    this.set('isLoading', false);
    this.set('isAssigningToOtherCase', false);
  },

  actions: {
    cancel() {
      this.toggleAllPropertiesBackToDefault();
    },

    showMultipleOptions() {
      this.toggleProperty('isShowingOptions');
    },

    requestDeleteSubcase(subcase) {
      this.set('isDeletingSubcase', true);
      this.set('subcaseToDelete', subcase);
    },

    proposeForOtherAgenda(subcase) {
      this.toggleProperty('isAssigningToOtherAgenda');
      this.set('selectedSubcase', subcase);
    },

    async proposeForAgenda(subcase, meeting) {
      this.set('isLoading', true);
      const meetingRecord = await this.store.findRecord('meeting', meeting.get('id'));
      const designAgenda = await this.store.findRecord('agenda', (await meetingRecord.get('latestAgenda')).get('id'));
      //ensures latest state is pulled
      await designAgenda.reload();
      await designAgenda.belongsTo('status').reload();
      const isDesignAgenda = designAgenda.get('isDesignAgenda');
      if (isDesignAgenda) {
        await this.get('agendaService').createNewAgendaItem(designAgenda, subcase);
      }
      await subcase.hasMany('agendaitems').reload();
      this.toggleAllPropertiesBackToDefault();
    },

    async deleteSubcase() {
      this.set('isLoading', true);
      const subcaseToDelete = await this.get('subcaseToDelete');
      const caze = await subcaseToDelete.get('case');

      subcaseToDelete.hasMany('agendaitems').reload();
      const agendaitems = await subcaseToDelete.get('agendaitems');

      if (agendaitems && agendaitems.length > 0) {
        return;
      } else {
        await this.deleteSubcase(subcaseToDelete);
      }
      this.navigateToSubcaseOverview(caze);
    },
    triggerMoveSubcaseDialog() {
      this.set('isAssigningToOtherCase', true);
    },
    async moveSubcase(newCase) {
      this.subcase.set('case', newCase);
      await this.subcase.save();

      this.set('isAssigningToOtherCase', false);
      let caze = this.subcase.get('case');
      caze = await this.store.findRecord('case', caze.get('id'));
      caze.hasMany('subcases').reload();
      this.set('caseToDelete', caze);
      const subCases = caze.get('subcases');
      if (subCases.length > 0) {
        this.get('router').transitionTo('cases.case.subcases');
      } else {
        this.get('router').transitionTo('cases.case.subcases');
        // Prompt the user to Delete the case.
        // This works fine, but if the delete is done, there are indexing issues.
        //this.triggerDeleteCaseDialog();
      }
    },
    cancelDeleteSubcase() {
      this.set('isDeletingSubcase', false);
    },
    cancelDeleteCase() {
      this.set('promptDeleteCase', false);
      this.get('router').transitionTo('cases.case.subcases');
    }
  },
});
