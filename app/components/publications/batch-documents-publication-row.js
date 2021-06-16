import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

/**
 * @argument {Piece} piece
 * @argument {Case} case
 * @argument {function(Piece, PublicationFlow)} onLinkPublicationFlow
 * @argument {function(Piece)} onUnlinkPublicationFlow
 * @argument {function(Piece)} onOpenNewPublicationModal
*/
export default class PublicationsBatchDocumentsPublicationRowComponent extends Component {
  @service intl;

  linkModeOptions = [
    {
      isEnabledLink: true,
      label: this.intl.t('existing'),
    },
    {
      isEnabledLink: false,
      label: this.intl.t('none'),
    }
  ];

  @tracked selectedLinkModeOption;

  constructor() {
    super(...arguments);
    this.initLinkModeOption();
  }

  @action
  initLinkModeOption() {
    const isEnabledLink = !!this.args.piece.publicationFlow.get('id');
    this.selectedLinkModeOption = this.linkModeOptions.find((opt) => opt.isEnabledLink === isEnabledLink);
  }

  @action
  selectLinkModeOption(option) {
    this.selectedLinkModeOption = option;

    if (!option.isEnabledLink) {
      this.args.onUnlinkPublicationFlow(this.args.piece);
    }
  }

  @action
  selectPublicationFlow(publicationFlow) {
    if (publicationFlow) {
      this.args.onLinkPublicationFlow(this.args.piece, publicationFlow);
    } else {
      this.args.onUnlinkPublicationFlow(this.args.piece);
    }
  }
}
