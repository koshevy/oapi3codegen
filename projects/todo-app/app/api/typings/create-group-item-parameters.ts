/* tslint:disable */
/**
 * Model of parameters for API `/group/{groupId}/item`
 */
export interface CreateGroupItemParameters {
  /**
   * Uid of TODO group
   */
  groupId: number;
  /**
   * Force save group despite conflicts
   */
  forceSave?: any;
}
