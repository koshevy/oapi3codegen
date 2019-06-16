/* tslint:disable */
import { ToDosListBlank } from './to-dos-list-blank';

export type UpdateListRequest<
  TCode extends 'application/json' = 'application/json'
> = TCode extends 'application/json'
/**
 * ## Base part of data of list
 * Data needed for list creation
 */
  ? ToDosListBlank
  : any;
