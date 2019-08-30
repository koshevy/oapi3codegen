/* tslint:disable */
import { ToDosItemBlank } from './to-dos-item-blank';

export type RewriteGroupItemRequest<
  TCode extends 'application/json' = 'application/json'
> = TCode extends 'application/json'
/**
 * ## Base part of data of item in todo's group
 * Data about group item needed for creation of it
 */
  ? ToDosItemBlank
  : any;
