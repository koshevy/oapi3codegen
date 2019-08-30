/* tslint:disable */
/**
 * Model of parameters for API `/group/{groupId}/item`
 */
export interface GetGroupItemsParameters {
  /**
   * Uid of TODO group
   */
  groupId: number;
  /**
   * Filter groups by `complete` status
   */
  isComplete?: any;
}
