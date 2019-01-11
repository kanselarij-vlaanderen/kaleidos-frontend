import Route from '@ember/routing/route';

export default Route.extend({
  beforeModel() {
    this._super(...arguments);
    this.transitionTo('cases.case.subcases');
  },
  model(params) {
    return this.store.findRecord('case', params.id);
  }
});
