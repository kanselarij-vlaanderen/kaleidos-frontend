import DS from 'ember-data';
import { computed } from '@ember/object';
import CONSTANTS from 'frontend-kaleidos/config/constants';
import LoadableModel from 'ember-data-storefront/mixins/loadable-model';
import { A } from '@ember/array';

const {
  Model,
  attr,
  belongsTo,
  hasMany,
} = DS;

export default Model.extend(LoadableModel, {
  name: computed.alias('serialnumber'),
  title: attr('string'),
  serialnumber: attr('string'),
  issued: attr('datetime'),
  createdFor: belongsTo('meeting'),
  status: belongsTo('agendastatus', {
    inverse: null,
  }),
  agendaitems: hasMany('agendaitem', {
    inverse: null,
    serialize: false,
  }),
  created: attr('datetime'),
  modified: attr('datetime'),

  // the next and previous version of agenda is set in agenda-approve-service, read-only in frontend
  previousVersion: belongsTo('agenda', {
    inverse: 'nextVersion',
    serialize: false,
  }),
  nextVersion: belongsTo('agenda', {
    inverse: 'previousVersion',
    serialize: false,
  }),
  isDesignAgenda: computed('status.isDesignAgenda', function() {
    return this.get('status.isDesignAgenda');
  }),

  isApproved: computed('status.isApproved', function() {
    return this.get('status.isApproved');
  }),

  async asyncCheckIfDesignAgenda() {
    await this.get('status');

    return this.get('isDesignAgenda');
  },

  agendaName: computed('serialnumber', 'status', function() {
    const isDesignAgenda = this.get('status.isDesignAgenda');
    const agendaName = this.serialnumber || '';
    let prefix;
    if (isDesignAgenda) {
      prefix = 'Ontwerpagenda';
    } else {
      prefix = 'Agenda';
    }
    return `${prefix} ${agendaName}`;
  }),

  isFinal: computed.alias('status.isFinal'),

  lastAgendaitemPriority: computed('agendaitems.@each', function() {
    return this.get('agendaitems').then((agendaitems) => {
      const filteredAgendaitems = agendaitems.filter((agendaitem) => !agendaitem.showAsRemark);
      if (filteredAgendaitems.length === 0) {
        return 0;
      }
      return Math.max(...filteredAgendaitems.map((agendaitem) => agendaitem.priority || 0));
    });
  }),

  lastAnnouncementPriority: computed('agendaitems.@each', function() {
    return this.get('agendaitems').then((agendaitems) => {
      const announcements = agendaitems.filter((agendaitem) => agendaitem.showAsRemark);
      if (announcements.length === 0) {
        return 0;
      }
      return Math.max(...announcements.map((announcement) => announcement.priority || 0));
    });
  }),

  firstAgendaitem: computed('agendaitems.@each', function() {
    return DS.PromiseObject.create({
      promise: this.get('agendaitems').then((agendaitems) => agendaitems.sortBy('priority').get('firstObject')),
    });
  }),

  canBeApproved: computed('agendaitems.@each.formallyOk', function() {
    return this.get('agendaitems').then((agendaitems) => {
      const approvedAgendaitems = agendaitems.filter((agendaitem) => [CONSTANTS.ACCEPTANCE_STATUSSES.OK].includes(agendaitem.get('formallyOk')));
      return approvedAgendaitems.get('length') === agendaitems.get('length');
    });
  }),

  allAgendaitemsNotOk: computed('agendaitems.@each.formallyOk', function() {
    return this.get('agendaitems').then((agendaitems) => {
      const allAgendaitemsNotOk = agendaitems.filter((agendaitem) => [CONSTANTS.ACCEPTANCE_STATUSSES.NOT_OK, CONSTANTS.ACCEPTANCE_STATUSSES.NOT_YET_OK].includes(agendaitem.get('formallyOk')));
      return allAgendaitemsNotOk.sortBy('number');
    });
  }),

  allAgendaitemsNotOkLength: computed('allAgendaitemsNotOk', async function() {
    const agendaitemsToCount = await this.get('allAgendaitemsNotOk');
    return agendaitemsToCount.length;
  }),

  newAgendaitemsNotOk: computed('allAgendaitemsNotOk', async function() {
    const agendaitemsToFilter = await this.get('allAgendaitemsNotOk');
    const newAgendaitems = A([]);
    for (const agendaitem of agendaitemsToFilter) {
      const previousVersion = await agendaitem.get('previousVersion');
      if (!previousVersion) {
        newAgendaitems.pushObject(agendaitem);
      }
    }
    return newAgendaitems;
  }),

  approvedAgendaitemsNotOk: computed('allAgendaitemsNotOk', async function() {
    const agendaitemsToFilter = await this.get('allAgendaitemsNotOk');
    const approvedAgendaitems = A([]);
    for (const agendaitem of agendaitemsToFilter) {
      const previousVersion = await agendaitem.get('previousVersion');
      if (previousVersion) {
        approvedAgendaitems.pushObject(agendaitem);
      }
    }
    return approvedAgendaitems;
  }),

});
