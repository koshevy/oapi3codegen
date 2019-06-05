/* tslint:disable */
import { ToDosItem } from './to-dos-item';

/**
 * ## Todo's list
 * Object with todo's list of items
 */
export interface ToDosList {
  /**
   * An unique id of task
   */
  uid?: number;
  /**
   * Title of a list
   */
  title: string;
  /**
   * Detailed description of a list. Allowed using of Common Markdown.
   */
  description?: string;
  items: Array<ToDosItem>;
  /**
   * Whether all tasks in list are complete
   */
  isComplete?: boolean;
  /**
   * Date/time (ISO) when task was created
   */
  dateCreated?: string;
  /**
   * Date/time (ISO) when task was changed last time
   */
  dateChanged?: string;
}
