/* tslint:disable */
import { ToDosGroup } from './to-dos-group';

export type UpdateGroupRequest<
  TCode extends 'application/json' = 'application/json'
> = TCode extends 'application/json' ? ToDosGroup : any;
