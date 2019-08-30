/* tslint:disable */
import { HttpErrorBadRequest } from './http-error-bad-request';
import { HttpErrorServer } from './http-error-server';
import { ToDosGroup } from './to-dos-group';

export type GetGroupsResponse<
  TCode extends 200 | 400 | 500 = 200 | 400 | 500,
  TContentType extends 'application/json' = 'application/json'
> = TCode extends 200
  ? TContentType extends 'application/json'
    /**
     * TODO's groups
     */
    ? Array<ToDosGroup>
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
