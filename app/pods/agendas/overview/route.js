import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import moment from 'moment';

export default class AgendaOverviewRoute extends Route {
  @service agendaService;

  queryParams= {
    from: {
      refreshModel: true,
    },
    to: {
      refreshModel: true,
    },
  }

  async model(params) {
    const options = {
      sort: params.sort,
      page: {
        number: params.page,
        size: params.size,
      },
    };
    if (params.filter) {
      options.filter = params.filter;
    }
    if (params.from) {
      options['filter[:gte:planned-start]'] = moment(params.from, 'YYYY-MM-DD').utc()
        .format();
    }
    if (params.to) {
      options['filter[:lte:planned-start]'] = moment(params.to, 'YYYY-MM-DD').utc()
        .format();
    }
    return this.store.query('meeting', options);
  }

  @action
  refreshModel() {
    this.refresh();
  }
}
