import Route from '@ember/routing/route';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class CasesIndexRoute extends Route.extend() {
  @service store;

  queryParams = {
    page: {
      refreshModel: true,
      as: 'pagina',
    },
    size: {
      refreshModel: true,
      as: 'aantal',
    },
    sort: {
      refreshModel: true,
      as: 'sorteer',
    },
    showArchived: {
      refreshModel: true,
      as: 'toon_gearchiveerd',
    },
  };

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
    if (!params.showArchived) {
      options['filter[is-archived]'] = false;
    }
    const model = await this.store.query('case', options);
    return model;
  }

  @action
  refreshModel() {
    this.refresh();
  }
}