import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency-decorators';
import { all } from 'ember-concurrency';
import { A } from '@ember/array';
import CONFIG from 'fe-redpencil/utils/config';
import { inject as service } from '@ember/service';
import moment from 'moment';
import EmberObject, {
  action,
  set
} from '@ember/object';

export default class PublicationDocumentsController extends Controller {
  @service activityService;
  @service subcasesService;
  @tracked isOpenPieceUploadModal = false;
  @tracked isOpenTranslationRequestModal = false;
  @tracked isOpenPublishPreviewRequestModal = false;
  @tracked newPieces = A([]);
  @tracked isExpandedPieceView = false;
  @tracked isSavingPieces = false;
  @tracked isUploadModalResized = false;
  @tracked showLoader = false;
  @tracked showTranslationModal = false;
  @tracked translateActivity = {
    mailContent: '',
    finalTranslationDate: '',
    pieces: A([]),
  };
  @tracked previewActivity = {
    mailContent: '',
    pieces: A([]),
  };
  @tracked selectedPieces = A([]);

  // hacky way to refresh the checkboxes in the view without reloading the route
  @tracked renderPieces = true;

  @action
  toggleUploadModalSize() {
    this.isUploadModalResized = !this.isUploadModalResized;
  }

  @action
  changePieceSelection(selectedPiece) {
    if (this.selectedPieces[selectedPiece.id]) {
      delete this.selectedPieces[selectedPiece.id];
      selectedPiece.selected = false;
    const foundPiece = this.selectedPieces.find((piece) => piece.id === selectedPiece.id);
    if (foundPiece) {
      this.selectedPieces.removeObject(selectedPiece);
    } else {
      this.selectedPieces.pushObject(selectedPiece);
    }
  }

  @action
  openPieceUploadModal() {
    this.isOpenPieceUploadModal = true;
  }

  @action
  // eslint-disable-next-line class-methods-use-this
  showPieceViewer(pieceId) {
    window.open(`/document/${pieceId}`);
  }

  @action
  toggleFolderCollapse(piece) {
    piece.set('collapsed', !piece.collapsed);
  }

  @action
  uploadPiece(file) {
    const now = moment().utc()
      .toDate();
    const documentContainer = this.store.createRecord('document-container', {
      created: now,
    });
    const piece = this.store.createRecord('piece', {
      created: now,
      modified: now,
      file: file,
      accessLevel: this.defaultAccessLevel,
      confidential: false,
      name: file.filenameWithoutExtension,
      documentContainer: documentContainer,
    });
    this.newPieces.pushObject(piece);
  }

  @task
  *savePieces() {
    const savePromises = this.newPieces.map(async(piece) => {
      try {
        await this.savePiece.perform(piece);
      } catch (error) {
        await this.deletePiece.perform(piece);
        throw error;
      }
    });
    this.showLoader = true;
    this.isOpenPieceUploadModal = false;
    yield all(savePromises);
    this.showLoader = false;
    this.newPieces = A();
  }

  /**
   * Save a new document container and the piece it wraps
   */
  @task
  *savePiece(piece) {
    const documentContainer = yield piece.documentContainer;
    yield documentContainer.save();
    yield piece.save();
    const pieces = yield this.model.case.hasMany('pieces').reload();
    pieces.pushObject(piece);
    yield this.model.case.save();
  }

  @task
  *cancelUploadPieces() {
    const deletePromises = this.newPieces.map((piece) => this.deletePiece.perform(piece));
    yield all(deletePromises);
    this.newPieces = A();
    this.isOpenPieceUploadModal = false;
  }

  @task
  *deletePiece(piece) {
    const file = yield piece.file;
    yield file.destroyRecord();
    this.newPieces.removeObject(piece);
    const documentContainer = yield piece.documentContainer;
    yield documentContainer.destroyRecord();
    yield piece.destroyRecord();
  }

  /** PUBLISH PREVIEW ACTIVITIES **/

  @action
  openPublishPreviewRequestModal() {
    this.isOpenPublishPreviewRequestModal = true;
    this.translateActivity.pieces = this.selectedPieces;
  }

  @action
  cancelPublishPreviewRequestModal() {
    set(this.previewActivity, 'mailContent', '');
    this.isOpenPublishPreviewRequestModal = false;
  }

  @action
  async savePublishPreviewActivity() {
    this.showLoader = true;
    this.isOpenPublishPreviewRequestModal = false;

    // publishPreviewActivityType.
    const publishPreviewSubCaseType = await  this.store.findRecord('subcase-type', CONFIG.SUBCASE_TYPES.drukproef.id);

    // TODO take from other subcase maybe?
    const shortTitle = await this.model.case.shortTitle;
    const title = await this.model.case.title;

    // Create subase.
    const subcase = await this.subcasesService.createSubcaseForPublicationFlow(this.model.publicationFlow, publishPreviewSubCaseType, shortTitle, title);

    // Create activity in subcase.
    await this.activityService.createNewPublishPreviewActivity(this.previewActivity.mailContent, this.previewActivity.pieces, subcase);

    // Visual stuff.
    this.currentPieces.forEach((piece) => {
      piece.selected = false;
    });
    this.currentPieces = [...this.currentPieces];

    // Reset local activity to empty state.
    this.previewActivity = {
      mailContent: '',
      pieces: [],
    };
    this.showLoader = false;
  }

  /** TRANSLATION ACTIVITIES **/

  @action
  openTranslationRequestModal() {
    this.translateActivity.finalTranslationDate = this.model.publicationFlow.translateBefore;
    this.translateActivity.pieces = this.selectedPieces;
    this.showTranslationModal = true;
  }

  get getTranslateActivityBeforeDate() {
    if (this.model.publicationFlow.translateBefore) {
      return this.model.publicationFlow.translateBefore;
    }
    return new Date();
  }

  @action
  async saveTranslationActivity() {
    this.showLoader = true;
    this.showTranslationModal = false;
    // const translateSubCaseType = EmberObject.create({
    //   id: CONFIG.SUBCASE_TYPES.vertalen.id,
    //   uri: CONFIG.SUBCASE_TYPES.vertalen.url,
    // });
    const translateSubCaseType = await  this.store.findRecord('subcase-type', CONFIG.SUBCASE_TYPES.vertalen.id);

    // TODO take from other subcase maybe?
    const shortTitle = await this.model.case.shortTitle;
    const title = await this.model.case.title;

    // Create subase.
    const subcase = await this.subcasesService.createSubcaseForPublicationFlow(this.model.publicationFlow, translateSubCaseType, shortTitle, title);
    this.renderPieces = false;

    // Create activity in subcase.
    await this.activityService.createNewTranslationActivity(this.translateActivity.finalTranslationDate, this.translateActivity.mailContent, this.translateActivity.pieces, subcase);

    // Visual stuff.
    this.showLoader = false;
    this.selectedPieces = A([]);

    // Reset local activity to empty state.
    this.translateActivity = {
      mailContent: '',
      finalTranslationDate: '',
      pieces: [],
    };

    this.renderPieces = true;
  }

  @action
  cancelTranslationModal() {
    set(this.translateActivity, 'mailContent', '');
    this.showTranslationModal = false;
  }

  @action
  setTranslateActivityBeforeDate(dates) {
    this.translateActivity.finalTranslationDate = dates[0];
  }
}
