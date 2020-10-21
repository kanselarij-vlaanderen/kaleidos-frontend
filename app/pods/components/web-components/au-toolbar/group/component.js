import Component from '@glimmer/component';

export default class ToolbarGroup extends Component {
  get position() {
    if (this.args.position) {
      return `au2-tooÒlbar-complex__${this.args.position}`;
    }
    return 'au2-toolbar-complex__left';
  }
}
