import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import moment from 'moment';

export default class AgendasOverviewController extends Controller {
  @service sessionService;
  @service intl;
  @service agendaService;

  queryParams = ['from', 'to'];

  @tracked dateFilter = '';
  dateRegex = /^(?:(\d{1,2})[-,/])?(?:(\d{1,2})[-,/])?(\d{4})$/;
  sort = '-planned-start,number-representation';
  page = 0;
  size = 10;
  filter = '';

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
  setDateFilter(date) {
    const newDate = date.replace('-', '/');
    const match = this.dateRegex.exec(newDate);
    if (!match) {
      this.from = undefined;
      this.to = undefined;
    } else {
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

      this.from = min.format('YYYY-MM-DD');
      this.to = max.format('YYYY-MM-DD');

      this.set('from', min.format('YYYY-MM-DD'));
      this.set('to', max.format('YYYY-MM-DD'));
      this.set('page', 0);
    }
  }

  @action
  clearFilter() {
    this.set('to', null);
    this.set('from', null);
    this.set('dateFilter', '');
  }

  @action
  onClickRow(meeting) {
    meeting.get('latestAgenda').then((latestAgenda) => {
      const latestAgendaId = latestAgenda.get('id');
      this.transitionToRoute('agenda.agendaitems', meeting.id, latestAgendaId);
    });
  }
}
