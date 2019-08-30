/* tslint:disable */
import { ToDosGroupBlank } from './to-dos-group-blank';

export type RewriteGroupRequest<
  TCode extends 'application/json' = 'application/json'
> = TCode extends 'application/json'
/**
 * ## Base part of data of group
 * Data needed for group creation
 */
  ? ToDosGroupBlank
  : any;
