/* tslint:disable */
import { ToDosItemBlank } from './to-dos-item-blank';

export type UpdateListItemRequest<
  TCode extends 'application/json' = 'application/json'
> = TCode extends 'application/json'
/**
 * ## Base part of data of item in todo's list
 * Data about list item needed for creation of it
 */
  ? ToDosItemBlank
  : any;
