/* tslint:disable */
import { HttpErrorBadRequest } from './http-error-bad-request';
import { HttpErrorConflict } from './http-error-conflict';
import { HttpErrorNotFound } from './http-error-not-found';
import { HttpErrorServer } from './http-error-server';
import { ToDosItem } from './to-dos-item';

export type RewriteListResponse<
  TCode extends 200 | 204 | 400 | 404 | 409 | 500 =
    | 200
    | 204
    | 400
    | 404
    | 409
    | 500,
  TContentType extends 'application/json' = 'application/json'
> = TCode extends 200
  ? TContentType extends 'application/json'
    /**
     * ## Item in todo's list
     * Describe data structure of an item in list of tasks
     */
    ? ToDosItem
    : any
  : TCode extends 204
  ? TContentType extends 'application/json'
    /**
     * No changes. Should no have a response!
     */
    ? null
    : any
  : TCode extends 400
  ? TContentType extends 'application/json'
    ? HttpErrorBadRequest
    : any
  : TCode extends 404
  ? TContentType extends 'application/json'
    ? HttpErrorNotFound
    : any
  : TCode extends 409
  ? TContentType extends 'application/json'
    ? HttpErrorConflict
    : any
  : TCode extends 500
  ? TContentType extends 'application/json'
    ? HttpErrorServer
    : any
  : any;