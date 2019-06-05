/* tslint:disable */
import { ToDosItem } from './to-dos-item';

export type RewriteListItemRequest<
  TCode extends 'application/json' = 'application/json'
> = TCode extends 'application/json'
/**
 * ## Item in todo's list
 * Describe data structure of an item in list of tasks
 */
  ? ToDosItem
  : any;
