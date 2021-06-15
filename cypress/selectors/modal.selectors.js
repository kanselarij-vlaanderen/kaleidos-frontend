const selectors = {
  // 3x duplication, manage-government-fields, manage-ise-codes, model-manager
  manageInSettingsModal: {
    add: '[data-test-vl-model-manager-add]',
    edit: '[data-test-vl-model-manager-edit]',
    delete: '[data-test-vl-model-manager-delete]',
  },

  // new-publication-modal, move to publication
  publication: {
    modal: '[data-test-au-modal-publication-new]', // 3x duplication
    createButton: '[data-test-publication-button-create-new]',
    cancelButton: '[data-test-publication-button-cancel]', // 2x duplication
    publicationNumberInput: '[data-test-create-publication-modal-number-input]',
    publicationNumberSuffixInput: '[data-test-create-publication-modal-suffix-input]',
    publicationShortTitleTextarea: '[data-test-create-publication-modal-short-title-textarea]',
    publicationLongTitleTextarea: '[data-test-create-publication-modal-long-title-textarea]',
    alertInfo: '[data-test-auk-alert-info]', // refactor either to publication specific or auk reuse
    alertError: '[data-test-auk-alert-error]', // refactor either to publication specific or auk reuse
  },
  // move to auk
  auModal: {
    container: '[data-test-au-modal]',
    // comment header or header:{ }
    close: '[data-test-au-modal-header-close]',
    resize: '[data-test-au-modal-header-resize]',
    cancel: '[data-test-au-modal-footer-cancel]',
    save: '[data-test-au-modal-footer-save]',
    title: '[data-test-au-modal-header-title]',
    body: '[data-test-au-modal-body-content]',
  },

  ministerModalSelector: '[data-test-mandatee-selector]',
};
export default selectors;
