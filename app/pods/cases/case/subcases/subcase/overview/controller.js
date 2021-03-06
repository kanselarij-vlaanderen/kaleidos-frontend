import Controller from '@ember/controller';
import { alias } from '@ember/object/computed';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { saveChanges } from 'frontend-kaleidos/utils/agendaitem-utils';

export default class CasesCaseSubcasesSubcaseOverviewController extends Controller {
  @service currentSession;

  @alias('model') subcase;
  @tracked allSubcases;
  @tracked mandatees;
  @tracked submitter;
  @tracked governmentFields;
  @tracked iseCodes;

  @tracked isEditingTitles = false;

  @action
  cancelEditing() {
    this.isEditingTitles = false;
  }

  @action
  toggleIsEditing() {
    this.isEditingTitles = !this.isEditingTitles;
  }

  @action
  async saveMandateeData(mandateeData) {
    // fields to ise
    let correspondingIseCodes = [];
    if (mandateeData.fields.length) {
      correspondingIseCodes = await this.store.query('ise-code', {
        'filter[field][:id:]': mandateeData.fields.map((field) => field.id).join(','),
      });
    }
    const propertiesToSetOnAgendaitem = {
      mandatees: mandateeData.mandatees,
    };
    const propertiesToSetOnSubcase = {
      mandatees: mandateeData.mandatees,
      requestedBy: mandateeData.submitter,
      iseCodes: correspondingIseCodes,
    };
    this.governmentFields = mandateeData.fields;
    this.mandatees = mandateeData.mandatees;
    this.submitter = mandateeData.submitter;
    this.iseCodes = correspondingIseCodes;
    await saveChanges(this.subcase, propertiesToSetOnAgendaitem, propertiesToSetOnSubcase, true);
  }
}
