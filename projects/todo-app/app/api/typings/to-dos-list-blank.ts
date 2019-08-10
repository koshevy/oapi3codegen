/* tslint:disable */
import { ToDosItemBlank } from './to-dos-item-blank';

/**
 * ## Base part of data of list
 * Data needed for list creation
 */
export interface ToDosListBlank {
  /**
   * Title of a list
   */
  title: string;
  /**
   * Detailed description of a list. Allowed using of Common Markdown.
   */
  description?: string;
  items: Array<ToDosItemBlank>;
  /**
   * Whether all tasks in list are complete
   */
  isComplete?: boolean;
}
