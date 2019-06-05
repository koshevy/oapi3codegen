/* tslint:disable */
import { HttpErrorBadRequest } from './http-error-bad-request';
import { HttpErrorServer } from './http-error-server';
import { ToDosItem } from './to-dos-item';

export type GetListResponse<
  TCode extends 200 | 400 | 500 = 200 | 400 | 500,
  TContentType extends 'application/json' = 'application/json'
> = TCode extends 200
  ? TContentType extends 'application/json'
    /**
     * ## Item in todo's list
     * Describe data structure of an item in list of tasks
     */
    ? ToDosItem
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
