/* tslint:disable */
import { ToDosItemBlank } from './to-dos-item-blank';

/**
 * ## Base part of data of group
 * Data needed for group creation
 */
export interface ToDosGroupBlank {
  /**
   * Title of a group
   */
  title: string;
  /**
   * Detailed description of a group in one/two sequences.
   */
  description?: string;
  items: Array<ToDosItemBlank>;
  /**
   * Whether all tasks in group are complete
   */
  isComplete?: boolean;
}
