/* tslint:disable */
import { ToDosList } from './to-dos-list';

export type UpdateListRequest<
  TCode extends 'application/json' = 'application/json'
> = TCode extends 'application/json' ? ToDosList : any;
