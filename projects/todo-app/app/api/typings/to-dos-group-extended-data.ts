/* tslint:disable */
/**
 * ## Extended data of group
 * Extended data has to be obtained after first save
 */
export interface ToDosGroupExtendedData {
  /**
   * An unique id of task
   */
  uid: number;
  /**
   * Date/time (ISO) when task was created
   */
  dateCreated: string;
  /**
   * Date/time (ISO) when task was changed last time
   */
  dateChanged: string;
}
