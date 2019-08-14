/* tslint:disable */
import { AttachmentMetaDocument } from './attachment-meta-document';
import { AttachmentMetaImage } from './attachment-meta-image';

/**
 * ## Base part of data of item in todo's list
 * Data about list item needed for creation of it
 */
export interface ToDosItemBlank {
  /**
   * An unique id of list that item belongs to
   */
  listUid: number;
  /**
   * Short brief of task to be done
   */
  title: string;
  /**
   * Detailed description and context of the task. Allowed using of Common Markdown.
   */
  description?: any;
  /**
   * Status of task: is done or not
   */
  isDone: boolean;
  /**
   * Any material attached to the task: may be screenshots, photos, pdf- or doc-
   * documents on something else
   */
  attachments?: Array<
    | AttachmentMetaImage // Meta data of image attached to task
    | AttachmentMetaDocument // Meta data of document attached to task
    | string // Link to any external resource
  >;
}
