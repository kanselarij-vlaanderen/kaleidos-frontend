import Component from '@glimmer/component';
import { enqueueTask } from 'ember-concurrency-decorators';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import {
  action, get
} from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { alias } from '@ember/object/computed';

export default class FileUploader extends Component {
  @service store;

  @service fileQueue;

  tagName = 'span';

  @tracked uploadedFileLength = null;

  multipleFiles = this.args.multipleFiles;

  @tracked isLoading = null;
  @tracked blockInterface = false;

  @tracked filesInQueue = alias('fileQueue.files');

  uploadedFileAction = this.args.uploadedFileAction;

  @action
  insertElementInDom() {
    this.isLoading = false;
    this.uploadedFileLength = 0;
    this.filesInQueue = A([]);
  }

  @enqueueTask({
    maxConcurrency: 3,
  }) *uploadFileTask(file) {
    this.blockInterface = true;
    try {
      this.isLoading = true;
      file.readAsDataURL().then(() => {
      });
      const response = yield file.upload('/files');
      const fileTest = yield this.store.findRecord('file', response.body.data.id);
      this.uploadedFileAction(fileTest);
      this.uploadedFileLength += 1;
    } catch (exception) {
      this.isLoading = false;
      console.warn('An exception occurred', exception);
      this.blockInterface = false;
    } finally {
      this.isLoading = false;
      this.blockInterface = false;
    }
  }

  @action
  uploadFile(file) {
    get(this, 'uploadFileTask').perform(file);
  }
}
