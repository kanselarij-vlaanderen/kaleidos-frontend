import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import moment from 'moment';

export default class AgendasOverviewController extends Controller {
  @service sessionService;
  @service intl;
  @service agendaService;

  queryParams = {
    page: {
      type: 'number',
    },
    size: {
      type: 'number',
    },
    sort: {
      type: 'string',
    },
    from: {
      type: 'string',
    },
    to: {
      type: 'string',
    },
  };

  @tracked dateFilter = '';
  sort = '-planned-start,number-representation';
  page = 0;
  size = 10;

  get activeAgendas() {
    console.warn('Not implemented: Getting active agendas');
    return null;
  }

  // activeAgendas: computed('model', async function() {
  //   const dateOfToday = moment().seconds(0)
  //     .milliseconds(0)
  //     .minutes(0)
  //     .hours(0)
  //     .utc()
  //     .subtract(1, 'weeks')
  //     .format();
  //   const meetings = await this.store.query('meeting', {
  //     filter: {
  //       ':gte:planned-start': dateOfToday,
  //     },
  //     sort: 'planned-start,number-representation',
  //   });
  //   const activeAgendas = await this.agendaService.getActiveAgendas(dateOfToday);

  //   return meetings.filter((meeting) => this.checkIfAgendaIsPresent(activeAgendas, meeting));
  // }),

  // checkIfAgendaIsPresent(activeAgendas, meeting) {
  //   const foundItem = activeAgendas.find((activeAgenda) => activeAgenda.meeting_id === meeting.id);
  //   if (!foundItem) {
  //     return false;
  //   }
  //   return true;
  // }

  @action
  setDateFilter() {
    const match = /^(?:(\d{1,2})[-,/])?(?:(\d{1,2})[-,/])?(\d{4})$/.exec(this.dateFilter);
    if (!match) {
      this.from = null;
      this.to = null;
      return;
    }
    const min = moment(parseInt(match[3], 10), 'YYYY', true);
    let unitToAdd;
    if (match[1] && match[2]) {
      unitToAdd = 'day';
      min.set('date', parseInt(match[1], 10));
      min.set('month', parseInt(match[2], 10) - 1); // Count starts from 0
    } else if (match[1]) {
      unitToAdd = 'month';
      min.set('month', parseInt(match[1], 10) - 1); // Count starts from 0
    } else {
      unitToAdd = 'year';
    }
    const max = min.clone().add(1, `${unitToAdd}s`);
    this.set('from', min.format('YYYY-MM-DD')); // TODO: setter instead of @tracked on qp's before updating to Ember 3.22+ (https://github.com/emberjs/ember.js/issues/18715)
    this.set('to', max.format('YYYY-MM-DD')); // TODO: setter instead of @tracked on qp's before updating to Ember 3.22+ (https://github.com/emberjs/ember.js/issues/18715)
    this.set('page', 0); // TODO: setter instead of @tracked on qp's before updating to Ember 3.22+ (https://github.com/emberjs/ember.js/issues/18715)
  }

  @action
  clearFilter() {
    this.set('from', null); // TODO: setter instead of @tracked on qp's before updating to Ember 3.22+ (https://github.com/emberjs/ember.js/issues/18715)
    this.set('to', null); // TODO: setter instead of @tracked on qp's before updating to Ember 3.22+ (https://github.com/emberjs/ember.js/issues/18715)
    this.set('dateFilter', ''); // TODO: setter instead of @tracked on qp's before updating to Ember 3.22+ (https://github.com/emberjs/ember.js/issues/18715)
  }

  @action
  async onClickRow(meeting) {
    const agenda = await meeting.latestAgenda;
    this.transitionToRoute('agenda.agendaItems', meeting.id, agenda.id);
  }
}
