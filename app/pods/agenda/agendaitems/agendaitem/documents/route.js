import Route from '@ember/routing/route';
import { action } from '@ember/object';
import CONSTANTS from 'frontend-kaleidos/config/constants';
import { PAGE_SIZE } from 'frontend-kaleidos/config/config';
import { sortPieces } from 'frontend-kaleidos/utils/documents';
import VrNotulenName,
{ compareFunction as compareNotulen } from 'frontend-kaleidos/utils/vr-notulen-name';

export default class DocumentsAgendaitemAgendaitemsAgendaRoute extends Route {
  async model() {
    const agendaitem = this.modelFor('agenda.agendaitems.agendaitem');
    let pieces = await this.store.query('piece', {
      'filter[agendaitems][:id:]': agendaitem.id,
      'page[size]': PAGE_SIZE.PIECES, // TODO add pagination when sorting is done in the backend
      include: 'document-container',
    });
    pieces = pieces.toArray();
    let sortedPieces;
    if (agendaitem.isApproval) {
      sortedPieces = sortPieces(pieces, VrNotulenName, compareNotulen);
    } else {
      sortedPieces = sortPieces(pieces);
    }

    return {
      pieces: sortedPieces,
      // linkedPieces: this.modelFor('agenda.agendaitems.agendaitem').get('linkedPieces')
    };
  }

  async afterModel() {
    this.defaultAccessLevel = await this.store.findRecordByUri('access-level', CONSTANTS.ACCESS_LEVELS.INTERN_REGERING);
    this.agendaitem = this.modelFor('agenda.agendaitems.agendaitem');
    this.currentAgenda = await this.agendaitem.agenda;
    this.previousAgenda = await this.currentAgenda.previousVersion;
  }

  setupController(controller) {
    super.setupController(...arguments);
    controller.agendaitem = this.agendaitem;
    controller.defaultAccessLevel = this.defaultAccessLevel;
    controller.isEnabledPieceEdit = false;
    controller.isOpenPieceUploadModal = false;
    controller.isOpenPublicationModal = false;
    controller.currentAgenda = this.currentAgenda;
    controller.previousAgenda = this.previousAgenda;
    controller.loadNewPieces.perform();
  }

  @action
  reloadModel() {
    this.refresh();
  }
}
