/* tslint:disable */
import { HttpErrorBadRequest } from './http-error-bad-request';
import { HttpErrorNotFound } from './http-error-not-found';
import { HttpErrorServer } from './http-error-server';
import { ToDosItem } from './to-dos-item';

export type GetListItemsResponse<
  TCode extends 200 | 400 | 404 | 500 = 200 | 400 | 404 | 500,
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
  : TCode extends 404
  ? TContentType extends 'application/json'
    ? HttpErrorNotFound
    : any
  : TCode extends 500
  ? TContentType extends 'application/json'
    ? HttpErrorServer
    : any
  : any;
