import Component from '@ember/component';
import { inject } from '@ember/service';
import moment from 'moment';

export default Component.extend({
  title: null,
  shortTitle: null,
  confidential: false,
  store: inject(),

  createCase(newDate) {
    const { title, shortTitle, type, selectedMeeting, submitter, confidential } = this;

    return this.store.createRecord('case',
      {
        title, shortTitle, submitter, type, confidential,
        isArchived: false,
        created: newDate,
        relatedMeeting: selectedMeeting
      });
  },

  actions: {
    async createCase($event) {
      this.set('isLoading', true);
      $event.preventDefault();
      const newDate = moment().utc().toDate();
      const caze = this.createCase(newDate);

      caze.save().then((newCase) => {
        this.set('isLoading', false);
        this.close(newCase);
      });
    },

    chooseTheme(theme) {
      this.set('selectedThemes', theme);
    },

    statusChange(status) {
      this.set('status', status);
    },

    submitterChanged(submitter) {
      this.set('submitter', submitter);
    },

    selectedMeetingChanged(meeting) {
      this.set('selectedMeeting', meeting);
    },

    close() {
      this.close();
    }
  }
});
