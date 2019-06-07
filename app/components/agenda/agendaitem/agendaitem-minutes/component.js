import Component from '@ember/component';
import { inject } from '@ember/service';
import { alias } from '@ember/object/computed';
import isAuthenticatedMixin from 'fe-redpencil/mixins/is-authenticated-mixin';

export default Component.extend(isAuthenticatedMixin, {
	store: inject(),
	sessionService: inject(),
	classNames: ['vlc-padding-bottom--large'],
	isEditing: false,

	currentSession: alias('sessionService.currentSession'),

	actions: {
		async toggleIsEditing() {
			const agendaitemNotes = await this.get('agendaitem.meetingRecord');

			if (!agendaitemNotes) {
				const meetingRecord = this.store.createRecord('meeting-record', {
					created: new Date(),
					modified: new Date(),
					announcements: null,
					others: null,
					description: "",
					attendees: [],
					agendaitem: await this.get('agendaitem'),
					meeting: null
				})
				await meetingRecord.save()
			}
			this.toggleProperty('isEditing');
		},

		async saveChanges(meetingRecord) {
			const recordToSave = this.store.peekRecord('meeting-record', meetingRecord.get('id'));
			await recordToSave.save();
			this.toggleProperty('isEditing');
		}
	}
});
