/* tslint:disable */
import { HttpErrorBadRequest } from './http-error-bad-request';
import { HttpErrorServer } from './http-error-server';
import { ToDosGroup } from './to-dos-group';

export type CreateGroupResponse<
  TCode extends 201 | 400 | 500 = 201 | 400 | 500,
  TContentType extends 'application/json' = 'application/json'
> = TCode extends 201
  ? TContentType extends 'application/json'
    ? ToDosGroup
    : any
  : TCode extends 400
  ? TContentType extends 'application/json'
    ? HttpErrorBadRequest
    : any
  : TCode extends 500
  ? TContentType extends 'application/json'
    ? HttpErrorServer
    : any
  : any;