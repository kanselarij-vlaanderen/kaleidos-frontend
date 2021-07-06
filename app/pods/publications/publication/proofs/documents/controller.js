/* eslint-disable no-dupe-class-members */
import Controller from '@ember/controller';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { PUBLICATION_EMAIL } from 'frontend-kaleidos/config/config';

const COLUMN_MAP = {
  'ontvangen-op': 'receivedDate',
  'geupload-op': 'created',
};

const REQUEST_STAGES = {
  INITIAL: 'initial',
  EXTRA: 'extra',
  FINAL: 'final',
};

export default class PublicationsPublicationProofsDocumentsController extends Controller {
  queryParams = [{
    qpSortingString: {
      as: 'volgorde',
    },
  }];

  @service currentSession;

  // TODO: don't do tracking on qp's before updating to Ember 3.22+ (https://github.com/emberjs/ember.js/issues/18715)
  /** @type {string} key name, prepended with minus if descending */
  qpSortingString;

  @tracked publicationFlow;
  @tracked publicationSubcase;
  @tracked selectedPieces = [];
  @tracked sortingString = undefined;
  @tracked isProofRequestModalOpen = false;
  @tracked isPieceUploadModalOpen = false;
  @tracked proofRequestStage;

  initSort() {
    this.sortingString = this.qpSortingString;
    this.sort(this.sortingString);
  }

  get areAllPiecesSelected() {
    return this.model.length === this.selectedPieces.length;
  }

  get isRequestingDisabled() {
    return this.selectedPieces.length === 0;
  }

  @action
  togglePieceSelection(selectedPiece) {
    const isPieceSelected = this.selectedPieces.includes(selectedPiece);
    if (isPieceSelected) {
      this.selectedPieces.removeObject(selectedPiece);
    } else {
      this.selectedPieces.pushObject(selectedPiece);
    }
  }

  @action
  toggleAllPiecesSelection() {
    if (this.areAllPiecesSelected) {
      this.selectedPieces = [];
    } else {
      this.selectedPieces = [...this.model];
    }
  }

  @action
  changeSorting(sortingString) {
    this.sortingString = sortingString;
    this.set('qpSortingString', sortingString);
    this.sort(sortingString);
  }

  sort(sortingString) {
    let property = 'created';
    let isDescending = false;
    if (sortingString) {
      isDescending = sortingString.startsWith('-');
      const sortKey = sortingString.substr(isDescending);
      property = COLUMN_MAP[sortKey] ?? property;
    }

    // this.model.sortBy(property) does not work properly
    this.model.sort((piece1, piece2) => piece1[property] - piece2[property]);
    if (isDescending) {
      this.model.reverse();
    }

    // sort is not tracked by ember
    this.model.arrayContentDidChange();
  }

  @action
  openProofRequestModal(stage) {
    this.proofRequestStage = stage;
    this.isProofRequestModalOpen = true;
  }

  @action
  closeProofRequestModal() {
    this.isProofRequestModalOpen = false;
  }

  @action
  async saveProofRequest(requestProperties) {
    try {
      await this.performSaveProofRequest(requestProperties);
    } finally {
      this.isProofRequestModalOpen = false;
    }
    this.selectedPieces = [];
    this.transitionToRoute('publications.publication.proofs.requests');
  }

  @action
  openPieceUploadModal() {
    this.isPieceUploadModalOpen = true;
  }

  @action
  cancelPieceUploadModal() {
    this.isPieceUploadModalOpen = false;
  }

  @action
  async saveCorrectionDocument(pieceProperties) {
    let piece;
    try {
      piece = await this.performSaveCorrectionDocument({
        piece: pieceProperties,
        publicationSubcase: this.publicationSubcase,
      });
    } finally {
      this.isPieceUploadModalOpen = false;
    }
    this.model.pushObject(piece);
    this.sort(this.sortingString);
  }

  async performSaveProofRequest(proofRequest) {
    const now = new Date();

    // REQUEST ACTIVITY
    const requestActivity = this.store.createRecord('request-activity', {
      startDate: now,
      title: proofRequest.subject,
      publicationSubcase: proofRequest.publicationSubcase,
      usedPieces: proofRequest.attachments,
    });
    await requestActivity.save();

    // RESULT ACTIVITY
    const activityProperties = {
      startDate: now,
      title: proofRequest.subject,
      subcase: proofRequest.publicationSubcase,
      requestActivity: requestActivity,
      usedPieces: proofRequest.attachments,
    };
    let activity;
    if (proofRequest.stage === REQUEST_STAGES.INITIAL) {
      activity = this.store.createRecord('proofing-activity', activityProperties);
    } else if (proofRequest.stage === REQUEST_STAGES.FINAL) {
      activity = this.store.createRecord('publication-activity', activityProperties);
    } else {
      throw new Error(`unknown request stage: ${proofRequest.stage}`);
    }
    const activitySave = activity.save();
    const saves = [activitySave];

    // PUBLICATION SUBCASE
    if (!proofRequest.publicationSubcase.startDate) {
      proofRequest.publicationSubcase.startDate = now;
      const publicationSubcaseSave = proofRequest.publicationSubcase.save();
      saves.push(publicationSubcaseSave);
    }

    // EMAIL
    const filePromises = proofRequest.attachments.mapBy('file');
    const filesPromise = Promise.all(filePromises);
    const outboxPromise = this.store.findRecordByUri('mail-folder', PUBLICATION_EMAIL.OUTBOX);
    const mailSettingsPromise = this.store.queryOne('email-notification-setting');
    const [files, outbox, mailSettings] = await Promise.all([filesPromise, outboxPromise, mailSettingsPromise]);
    const mail = this.store.createRecord('email', {
      to: mailSettings.proofRequestToEmail,
      from: mailSettings.defaultFromEmail,
      folder: outbox,
      subject: proofRequest.subject,
      message: proofRequest.message,
      attachments: files,
      requestActivity: requestActivity,
    });
    const emailSave = mail.save();
    saves.push(emailSave);

    await Promise.all(saves);
  }

  async performSaveCorrectionDocument(correctionProperties) {
    const {
      piece: {
        file, name,
      },
      publicationSubcase: publicationSubcase,
    } = correctionProperties;

    const now = new Date();

    const documentContainer = this.store.createRecord('document-container', {
      created: now,
    });
    await documentContainer.save();

    const piece = this.store.createRecord('piece', {
      created: now,
      modified: now,
      file: file,
      confidential: false,
      name: name,
      documentContainer: documentContainer,
      publicationSubcaseCorrectionFor: publicationSubcase,
    });
    await piece.save();

    return piece;
  }
}
