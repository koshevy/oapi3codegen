/* tslint:disable */
/**
 * Model of parameters for API `/group/{groupId}/item/{itemId}`
 */
export interface UpdateGroupItemParameters {
  /**
   * Uid of TODO group
   */
  groupId: number;
  /**
   * Uid of TODO group item
   */
  itemId: number;
  /**
   * Force save group despite conflicts
   */
  forceSave?: any;
}
