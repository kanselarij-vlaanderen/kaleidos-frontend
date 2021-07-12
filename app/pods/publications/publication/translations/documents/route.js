import Route from '@ember/routing/route';
import { action } from '@ember/object';
import { PAGE_SIZE } from 'frontend-kaleidos/config/config';

export default class PublicationsPublicationTranslationsDocumentRoute extends Route {
  async model() {
    this.translationSubcase = this.modelFor('publications.publication.translations');

    const queryProperties = {
      include: [
        'file',
        'publication-subcase-source-for'
      ].join(','),
      'page[size]': PAGE_SIZE.PUBLICATION_FLOW_PIECES,
    };

    // multiple requests: single request on translation-subcase did not detect inverse relations of piece to the publication-subcase
    //  and did an extra request per piece
    const sourceDocumentsQuery = this.store.query('piece', {
      'filter[translation-subcase][:id:]': this.translationSubcase.id,
      ...queryProperties,
    });

    const generatedPiecesQuery = this.store.query('piece', {
      'filter[translation-activity-generated-by][subcase][:id:]': this.translationSubcase.id,
      ...queryProperties,
    });

    let pieces = await Promise.all([sourceDocumentsQuery, generatedPiecesQuery]);
    pieces = pieces.flatMap((pieces) => pieces.toArray());
    pieces = new Set(pieces); // using set to ensure a collection of unique pieces
    pieces = [...pieces];
    pieces = pieces.sortBy('created').reverseObjects();

    return pieces;
  }

  async afterModel() {
    // translationSubcase.publicationFlow causes network request while, but the request is already made in 'publications.publication'
    this.publicationFlow = this.modelFor('publications.publication');
    this.publicationSubcase = await this.publicationFlow.publicationSubcase;
  }

  setupController(controller) {
    super.setupController(...arguments);
    controller.publicationFlow = this.publicationFlow;
    controller.translationSubcase = this.translationSubcase;
    controller.publicationSubcase = this.publicationSubcase;
    controller.selectedPieces = [];
    controller.isPieceUploadModalOpen = false;
    controller.isTranslationRequestModalOpen = false;
  }

  @action
  refresh() {
    super.refresh();
  }
}
