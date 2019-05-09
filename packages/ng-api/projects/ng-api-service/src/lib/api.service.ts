import * as Ajv from 'ajv';
import * as _lodash from 'lodash';
const _ = _lodash;

import {
    HttpClient,
    HttpEvent,
    HttpRequest,
    HttpErrorResponse,
    HttpResponse,
    HttpEventType
} from '@angular/common/http';
import { HttpParams } from '@angular/common/http/src/params';
import { HttpHeaders } from '@angular/common/http/src/headers';

import {
    BehaviorSubject,
    Observable,
    Subscriber,
    Subject
} from 'rxjs';
import {
    filter,
    switchMap,
    takeUntil
} from 'rxjs/operators';

import { ApiSchema } from './providers/api-schema';
import {
    ServersInfo,
  UrlWhitelistDefinitions
} from './providers/servers.info.provider';
import {
    ApiErrorEventType,
    ApiErrorHandler,
    ValidationType,
    ValidationError
} from './providers/event-manager.provider';
import { RequestSender } from './providers/request-sender';

/**
 * Reg of localhost-based URLS
 */
const localhostReg = /^(https?:)?\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)/u;

// переопределение глобальных настроек `Lodash template`
_.templateSettings.interpolate = /{([\s\S]+?)}/g;

declare const Error;

export interface RequestMetadataResponse {
    url?: string;
    request?: Request;
}

export abstract class ApiService<R, B, P = null> implements RequestSender<R, B> {

    private static _ajv: {
        [key: string]: Ajv.Ajv
    } = {};

    protected abstract get method(): | ('DELETE' | 'GET' | 'HEAD' | 'JSONP' | 'OPTIONS')
                                     | ('POST'   | 'PUT' | 'PATCH');

    /**
     * JSON Schema, используемая для проверки данных запросов.
     */
    protected abstract get schema(): ApiSchema;

    /**
     * Шаблон пути, например: `/stock-cars/{id}`.
     */
    protected abstract get pathTemplate(): string;

    /**
     * Параметры в запросе.
     */
    protected abstract get queryParams(): string[];

    /**
     * Перечисление адресов серверов.
     */
    protected abstract get servers(): string[];

    private _ajvComplier: Ajv.Ajv;

    /**
     * Кэш скомпилированных ajv-валидаторов для этого сервиса.
     */
    private _ajvCaches: {[key: string]: any};

    // *** Методы

    /**
     *
     * @param httpClient
     * @param errorHandler
     * @param serversInfo
     * @param resetApiSubscribers
     * @param virtualConnectionStatus
     * @param disableValidation
     * @param domainSchema
     */
    protected constructor(
        protected httpClient: HttpClient,
        protected errorHandler: ApiErrorHandler,
        protected serversInfo: ServersInfo,
        protected resetApiSubscribers: Subject<void>,
        protected virtualConnectionStatus: BehaviorSubject<boolean>,
        protected disableValidation: boolean,
        domainSchema
    ) {
        const schemaId = domainSchema['$id'];
        if (!schemaId) {
            throw new Error('Domain schema should have an id!');
        }

        if (!ApiService._ajv[schemaId]) {
            ApiService._ajv[schemaId] = new Ajv({
                allErrors: true,
                coerceTypes: false,
                errorDataPath: 'property',
                formats: {},
                jsonPointers: false,
                ownProperties: true,
                removeAdditional: true,
                schemas: [domainSchema],
                // fixme нужно добавить основные OAS3-форматы
                // Swagger's custom formats not supported yet
                unknownFormats: [
                    'password',
                    'byte',
                    'binary',
                    'float',
                    'double',
                    'int32',
                    'int64'
                ],
                useDefaults: true,
                verbose: true,
            });
        }

        this._ajvComplier = ApiService._ajv[schemaId];
    }

    /**
     * Получение актуального пути (без завершающего слэша).
     * Если вернет `null`, скорее всего, надо использовать
     */
    public getServerPath(): string | null {
        const serversInfo = this.serversInfo;
        const allowedUrls = this.getActualServerUrls();

        const customRedefine = serversInfo.customRedefines
            && _.find(
                serversInfo.customRedefines,
                redefine => this instanceof redefine.serviceClass
            );

        if (!allowedUrls.length) {
            throw new Error('No server URL\'s in white list!');
        }

        const serverUrl = _.first(allowedUrls);

        // looking for custom redefines of server url
        // particulary for that class
        if (customRedefine) {
            return customRedefine.serverUrl;
        } else if (
            serversInfo.redefines &&
            serversInfo.redefines[serverUrl]
        ) {
            // or looking for common redefines of server url
            return serversInfo.redefines[serverUrl];
        }

        return serverUrl;
    }

    /**
     * Get url's list have to be used in queries
     */
    public getActualServerUrls(): string[] {
        let result: string[];

        switch (this.serversInfo.urlWhitelist) {
            // allow all server URLs
            case UrlWhitelistDefinitions.AllowAll:
                result = this.servers;
                break;
            // filter only localhost-based server URLs
            case UrlWhitelistDefinitions.AllowLocalhost:
                result =  _.filter(
                    this.servers,
                    (s: string) => localhostReg.test(s)
                );
                break;
            // Replaces all url's with http://localhost
            case UrlWhitelistDefinitions.ForceToLocalhost:
                result =  ['http://localhost'];
                break;

            default:
                // Expected to be array of string
                if (_.isString(this.serversInfo.urlWhitelist)) {
                    result = _.intersection(
                        this.serversInfo.urlWhitelist as string[],
                        this.servers
                    );
                } else {
                    throw new Error([
                        'Fatal error in @codegena/ng-api-service:',
                        'please, set correct `urlWhitelist` in ServersInfo!'
                    ].join(' '));
                }

        }

        if (!result.length) {
            throw new Error(
                'Fatal error in @codegena/ng-api-service: no allowed url\'s in whitelist!'
            );
        }

        return result;
    }

    /**
     * @param payLoad
     * @param params
     * @param requestOptions
     * @param statusSubject
     * @param metadataResponse
     *
     * Object that can be set for getting immediate response
     * with metadata of request. Mainly has uses in tests.
     */
    public request(
        payLoad: B,
        params: P = null,
        requestOptions: {
            headers?: HttpHeaders;
            reportProgress?: boolean;
            params?: HttpParams;
            responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
            withCredentials?: boolean;
        } = {},
        statusSubject?: Subject<HttpEvent<R>>,
        metadataResponse?: RequestMetadataResponse
    ): Observable<R> {

        // fixme query не используется
        const query = _.pick(params || {}, this.queryParams);
        const path = _.template(this.pathTemplate)(params || {});
        const server = _.trimEnd(this.getServerPath(), '/');

        // fixme temporary solution. Has to use HttpParams
        /** {@link https://angular.io/api/common/http/HttpParams} */
        const queryString = _(query)
            .map((v, k) => `${k}=` + (
                _.isArray(query)
                    ? query.join(',')
                    : ((typeof v === 'number') || (typeof v === 'string'))
                        ? v : JSON.stringify(v)
            ))
            .value()
            .join('&');

        if (requestOptions.withCredentials !== false) {
            requestOptions.withCredentials = true;
        }

        // !!! По поводу валидаций:
        // Валидации выполняются внутри Observable,
        // чтобы был доступ к subscriber. Тогда ему можно
        // отправить ошибку, которая может быть перехвачена
        // обработчиком запроса в компоненте, но при этом не
        // придется добавлять уровень в Observable.

        const url = `${server || ''}${path}?${queryString}`;
        const request = new HttpRequest<B>(this.method, url, payLoad, requestOptions);

        if (metadataResponse) {
            _.assign(metadataResponse, {
                request,
                url
            });
        }

        return Observable.create((subscriber: Subscriber<R>) => {

            // todo should validate headers

            // валидация входных параметров
            (this._validate(
                params,
                ValidationType.ParamsValidation,
                subscriber,
                statusSubject
            ) !== false)

            // валидация тела запроса
            && (this._validate(
                payLoad,
                ValidationType.RequestValidation,
                subscriber,
                statusSubject
            ) !== false)

            // Если ошибки валидации не прерывали запрос
            // (зависит от того, как реализован обработчик,
            // подробнее в описании ApiErrorHandler):
            // попытка отправить запрос.
            && this.requestAttempt(request, subscriber, statusSubject);
        }).pipe(
            takeUntil(this.resetApiSubscribers)
        );
    }

    /**
     * Попытка выполнения запроса, которая может быть повторена.
     * Метод используется для повторных запросов при обработке
     * ошибок, а также, внутри метода `request`.
     * @see request
     *
     * @param request
     * @param subscriber
     * @param statusSubject
     * @param lastError
     * Последняя возникшая ошибка, если это не первая попытка.
     * @param remainAttemptsNumber
     */
    public requestAttempt(
        request: HttpRequest<B>,
        subscriber: Subscriber<R>,
        statusSubject?: Subject<HttpEvent<R>>,
        lastError?: HttpErrorResponse,
        remainAttemptsNumber = 10
    ): void {

        if (!remainAttemptsNumber) {
            subscriber.error(lastError || {});
            subscriber.complete();

            return;
        }

        // Starts from BehaviorSubject with a connection status.
        // Coninue if (or when) a got status `true`.
        this.virtualConnectionStatus.pipe(
            filter<boolean>(status => status),
            switchMap<boolean, HttpEvent<R>>(() => this.httpClient.request(request)),
            takeUntil(this.resetApiSubscribers)
        ).subscribe(
            (event: HttpEvent<any>) => {
                // отправляется статус загрузки
                if (statusSubject) {
                    statusSubject.next(event);
                }

                // todo надо понять что приходит здесь
                switch (event.type) {
                    case HttpEventType.Sent:
                        break;

                    // todo дописать другие варианты

                    // Данные получены успешно
                    case HttpEventType.Response:
                        const body = (event as HttpResponse<R>).body;
                        const statusCode = (event as HttpResponse<R>).status;

                        // валидация ответа
                        (this._validate(
                            body,
                            ValidationType.ResponseValidation,
                            subscriber,
                            statusSubject,
                            statusCode
                        ) !== false)

                        // передача данных подписчику
                        && subscriber.next((event as HttpResponse<R>).body);

                        break;
                }
            },
            // Произошла ошибка, и ее нужно обработать;
            // возможно, подписчик даже не заметит этого,
            // если операция будет повторена, и результат
            // окажется положительным.
            (error: HttpErrorResponse) => this._handleHttpError(
                subscriber,
                request,
                error,
                statusSubject,
                remainAttemptsNumber - 1
            ),
            () => {
                // Запрос завершен
                subscriber.complete();

                if (statusSubject) {
                    statusSubject.complete();
                }
            }
        );
    }

    /**
     * @param value
     * @param type
     * @param subscriber
     * @param statusSubject
     * @param statusCode
     */
    protected _validate(
        value: any,
        type: ValidationType,
        subscriber: Subscriber<R>,
        statusSubject: Subject<HttpEvent<R>>,
        statusCode: number | null = null
    ): void | false {
        let validationError;

        if (this.disableValidation) {
            return;
        }

        if (!this._ajvCaches) {
            this._ajvCaches = {};
        }

        if (type === ValidationType.ResponseValidation) {
            if (!statusCode) {
                throw new Error(
                    'You should to pass a status code when the type of validation is a "response"!'
                );
            }
        }

        if (!this.schema[type]) {
            if (value) {
                validationError = new ValidationError(
                    `Validation error at: ${type}`,
                    type,
                    this,
                    this.schema[type],
                    value,
                    [
                        {
                            keyword: null,
                            message: 'Data without schema should not be set'
                        }
                    ]
                );
            } else {
                return;
            }
        } else {
            let schema;
            let cacheKey;

            if (type === ValidationType.ResponseValidation) {
                if (!statusCode) {
                    throw new Error([
                        'You should to pass a status code when the',
                        'type of validation is a "response"!'
                    ].join(' '));
                }

                cacheKey = `${type}_${statusCode}`;
                schema = this.schema[type][statusCode] || this.schema[type]['default'];

                if (!schema) {
                    throw new Error([
                        `Can\'t find response schema with code ${statusCode}.',
                        'Please set schema for code, or 'default'.`
                    ].join(' '));
                }
            } else {
                cacheKey = type;
                schema = this.schema[type];
            }

            if (!this._ajvCaches[cacheKey]) {
                this._ajvCaches[cacheKey] = this._ajvComplier
                    .compile(schema);
            }

            const validate = this._ajvCaches[cacheKey];

            if (!validate(value)) {
                validationError = new ValidationError(
                    `Validation error at: ${type}`,
                    type,
                    this,
                    schema,
                    value,
                    validate.errors
                );
            }
        }

        // Handle error
        if (validationError) {
            const handleResult = this.errorHandler
                ? this.errorHandler.onValidationError(validationError)
                : null;

            // Если обрабочтик вернул `false`,
            // ошибка игнорируется
            if (handleResult !== false) {
                subscriber.error(validationError);

                return false;
            }
        }
    }

    /**
     * @param subscriber
     * @param request
     * @param originalEvent
     * @param statusSubject
     * @param remainAttemptsNumber
     */
    protected _handleHttpError(
        subscriber: Subscriber<R>,
        request: HttpRequest<B>,
        originalEvent: HttpErrorResponse,
        statusSubject: Subject<HttpEvent<R>>,
        remainAttemptsNumber: number
    ) {
        let error;
        switch (originalEvent.status) {
            case 400:
                // todo здесь нужно реализовать комплексную логику обработки ошибок
                error = ApiErrorEventType.WrongArgumentSyntax;
                break;
            case 401:
                error = ApiErrorEventType.Unauthorized;
                break;
            case 403:
                error = ApiErrorEventType.Forbidden;
                break;
            case 404:
                error = ApiErrorEventType.NotFound;
                break;
            case 500:
            case 502:
            case 503:
            case 504:
                error = ApiErrorEventType.ServerError;
                break;
            default:
                error = ApiErrorEventType.UnknownError;
        }

        // Error response validation
        // Stops and falls process if not handled
        if (this._validate(
            originalEvent.error,
            ValidationType.ResponseValidation,
            subscriber,
            statusSubject,
            originalEvent.status
        ) !== false) {
            if (this.errorHandler) {
                this.errorHandler.onHttpError({
                    originalEvent,
                    remainAttemptsNumber,
                    request,
                    sender: this,
                    statusSubject,
                    subscriber,
                    type: error,
                    virtualConnectionStatus: this.virtualConnectionStatus
                });
            } else {
                subscriber.error(originalEvent);

                if (statusSubject) {
                    statusSubject.error(originalEvent);
                }
            }
        }
    }
}