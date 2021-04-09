import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class PublicationsFilterModal extends Component {
  @tracked filter;

  constructor() {
    super(...arguments);
    this.filter = this.args.filter.clone();
  }

  @action
  reset() {
    this.filter.reset();
  }

  @action
  toggleFilterOption(event) {
    this.filter[event.target.name] = event.target.checked;
  }
}
