/* tslint:disable */
import { ToDosList } from './to-dos-list';

export type CreateListRequest<
  TCode extends 'application/json' = 'application/json'
> = TCode extends 'application/json'
/**
 * ## Todo's list
 * Object with todo's list of items
 */
  ? ToDosList
  : any;
