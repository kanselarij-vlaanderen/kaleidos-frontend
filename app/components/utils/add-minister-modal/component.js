import Component from '@ember/component';
import ManageMinisterMixin from 'fe-redpencil/mixins/manage-minister-mixin';

export default Component.extend(ManageMinisterMixin, {
	selectedMandatee: null,

	actions: {
		async mandateeSelected(mandatee) {
			const rowToShow = await this.get('rowToShow');
			if (rowToShow) {
				rowToShow.domains.map((domain) => {
					const domainToClear = this.store.peekRecord('government-domain', domain.id);
					domainToClear.set('selected', false)
				});
				rowToShow.fields.map((field) => {
					const fieldToClear = this.store.peekRecord('government-field', field.id);
					fieldToClear.set('selected', false)
				});
			}
			this.set('selectedMandatee', mandatee);

			this.set('rowToShow', await this.refreshData(mandatee));
		}

	}
});
