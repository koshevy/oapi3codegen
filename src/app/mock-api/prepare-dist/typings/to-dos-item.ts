/* tslint:disable */
import { AttachmentMetaDocument } from './attachment-meta-document';
import { AttachmentMetaImage } from './attachment-meta-image';

/**
 * ## Item in todo's list
 * Describe data structure of an item in list of tasks
 */
export interface ToDosItem {
  /**
   * An unique id of task
   */
  uid?: number;
  /**
   * An unique id of list that item belongs to
   */
  listUid?: number;
  /**
   * Short brief of task to be done
   */
  title: string;
  /**
   * Detailed description and context of the task. Allowed using of Common Markdown.
   */
  description?: string;
  /**
   * Status of task: is done or not
   */
  isDone: boolean;
  /**
   * Date/time (ISO) when task was created
   */
  dateCreated?: string;
  /**
   * Date/time (ISO) when task was changed last time
   */
  dateChanged?: string;
  /**
   * Position of a task in list. Allows to track changing of state of a concrete
   * item, including changing od position.
   */
  position: number;
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
