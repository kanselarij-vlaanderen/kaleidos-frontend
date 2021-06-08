import Component from '@glimmer/component';

/**
 *
 * @argument {Boolean} noPadding
 */
export default class PanelBody extends Component {
  get noPadding() {
    if (this.args.noPadding) {
      return 'auk-panel__body--no-pad';
    }
    return '';
  }
}
