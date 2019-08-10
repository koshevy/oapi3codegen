/* tslint:disable */
/**
 * Model of parameters for API `/list`
 */
export interface GetListsParameters {
  /**
   * Filter lists by `complete` status
   */
  isComplete?: any;
  /**
   * Set it `true` if you want to get all list items with list. Always returns empty
   * `items` array when it's `false`.
   */
  withItems?: any;
}
