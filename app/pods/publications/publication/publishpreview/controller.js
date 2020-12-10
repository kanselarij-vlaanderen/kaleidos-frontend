import Controller from '@ember/controller';
import {
  action, set
} from '@ember/object';
import { tracked } from '@glimmer/tracking';
import CONFIG from 'fe-redpencil/utils/config';
import { A } from '@ember/array';

export default class PublicationPublishPreviewController extends Controller {
  // properties for making the design
  @tracked withdrawn = true;
  @tracked testDate = new Date();
  @tracked panelCollapsed = false;
  @tracked showLoader = false;
  @tracked showpublicationModal = false;
  @tracked panelIcon = 'chevron-down'
  @tracked publicationActivity = {
    mailContent: '',
    subjectContent: '',
    pieces: A([]),
  };

  get publishPreviewActivities() {
    const publishPreviewActivities = this.model.publishPreviewActivities.map((activity) => activity);
    return publishPreviewActivities;
  }

  @action
  collapsePanel() {
    this.panelCollapsed = !this.panelCollapsed;
    this.panelIcon = ((this.panelIcon === 'chevron-up') ? 'chevron-down' : 'chevron-up');
  }


  /** BS PUBLICATION ACTIVITIES **/

  @action
  async requestPublicationModal(activity) {
    this.publicationActivity.pieces = activity.usedPieces;
    const names = this.publicationActivity.pieces.map((piece) => piece.name).join('\n');
    set(this.publicationActivity, 'mailContent', CONFIG.mail.publishRequest.content.replace('%%attachments%%', names));
    set(this.publicationActivity, 'mailSubject', CONFIG.mail.publishRequest.subject.replace('%%nummer%%', this.model.publicationFlow.publicationNumber));
    this.showpublicationModal = true;
  }

  @action
  async cancelPublicationModal() {
    this.publicationActivity.pieces = A([]);
    set(this.publicationActivity, 'mailContent', '');
    set(this.publicationActivity, 'mailSubject', '');
    this.showpublicationModal = false;
  }

  @action
  async createPublicationActivity() {
    this.showpublicationModal = false;
    this.showLoader = true;
    this.showTranslationModal = false;

    // Fetch the type.
    const publishSubCaseType = await  this.store.findRecord('subcase-type', CONFIG.SUBCASE_TYPES.publicatieBS.id);

    // TODO take from other subcase maybe?
    const shortTitle = await this.model.case.shortTitle;
    const title = await this.model.case.title;

    // Create subase.
    const subcase = await this.subcasesService.createSubcaseForPublicationFlow(this.model.publicationFlow, publishSubCaseType, shortTitle, title);

    // Create activity in subcase.
    await this.activityService.createNewPublishActivity(this.publicationActivity.mailContent, this.publicationActivity.pieced, subcase);

    // Visual stuff.
    this.selectedPieces = A([]);

    // Reset local activity to empty state.
    this.publicationActivity = {
      mailContent: '',
      mailSubject: '',
      pieces: A([]),
    };
    this.showLoader = false;
    alert('the mails dont work yet. infra is working on it.');
  }

  /** BS PUBLICATION ACTIVITIES **/

  @action
  async cancelExistingTranslationActivity() {
    alert('this action is implemented in another ticket');
  }

  @action
  async checkExistingTranslationActivity() {
    alert('this action is implemented in another ticket');
  }

  @action
  addProof() {
    alert('this action is implemented in another ticket');
  }

  @action
  deleteProof() {
    alert('this action is implemented in another ticket');
  }

  @action
  editProof() {
    alert('this action is implemented in another ticket');
  }

  @action
  addImprovement() {
    alert('this action is implemented in another ticket');
  }

  @action
  deleteImprovement() {
    alert('this action is implemented in another ticket');
  }

  @action
  editImprovement() {
    alert('this action is implemented in another ticket');
  }
}
