import * as Ajv from 'ajv';
import * as _ from 'lodash';

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

import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { Subject } from 'rxjs/Subject';

import { ApiSchema } from './api-schema';
import {
    ServersData
} from './servers.data.provider';
import {
    ApiErrorEventType,
    ApiErrorHandler,
    ValidationType,
    ValidationError
} from './event-manager.provider';

// переопределение глобальных настроек `Lodash template`
_.templateSettings.interpolate = /{([\s\S]+?)}/g;

declare const Number: any;

export abstract class ApiMethodBase<R, B, P = null> {

    private static _ajv: {
        [key: string]: Ajv.Ajv
    } = {};

    protected abstract get method(): | ('DELETE' | 'GET' | 'HEAD' | 'JSONP' | 'OPTIONS')
                                     | ('POST'   | 'PUT' | 'PATCH');

    /**
     * JSON Schema, используемая для проверки данных запросов.
     * @returns {Schema}
     */
    protected abstract get schema(): ApiSchema;

    /**
     * Шаблон пути, например: `/stock-cars/{id}`.
     * @returns {string}
     */
    protected abstract get pathTemplate(): string;

    /**
     * Параметры в запросе.
     * @returns {string[]}
     */
    protected abstract get queryParams(): string[];

    /**
     * Перечисление адресов серверов.
     * @returns {string[]}
     */
    protected abstract get servers(): string[];

    /**
     * Мокап-данные для этого поля.
     * @returns {any}
     */
    protected abstract get mockData(): any;

    private _ajvComplier: Ajv.Ajv;

    /**
     * Кэш скомпилированных ajv-валидаторов для этого сервиса.
     */
    private _ajvCaches: {[key: string]: any}

    // *** Методы

    /**
     * @param {HttpClient} httpClient
     * @param {ApiErrorHandler} errorHandler
     * Обработчик ошибок HTTP-запросов и
     * @param {ServersData} serversData
     */
    constructor(
        protected httpClient: HttpClient,
        protected errorHandler: ApiErrorHandler,
        protected serversData: ServersData,
        domainSchema
    ) {
        const schemaId = domainSchema['$id'];
        if (!schemaId) {
            throw new Error('Domain schema should have an id!')
        }

        if (!ApiMethodBase._ajv[schemaId]) {
            ApiMethodBase._ajv[schemaId] = new Ajv({
                allErrors: true,
                coerceTypes: false,
                ownProperties: true,
                errorDataPath: 'property',
                useDefaults: true,
                removeAdditional: true,
                jsonPointers: false,
                verbose: true,
                schemas: [domainSchema],
                // fixme нужно добавить основные OAS3-форматы
                formats: {
                    float: v => Number.isInteger(Number(v))
                }
            });
        }

        this._ajvComplier = ApiMethodBase._ajv[schemaId];
    }

    /**
     * Получение актуального пути (без завершающего слэша).
     * Если вернет `null`, скорее всего, надо использовать
     * @returns {string | null}
     */
    public getServerPath(): string | null {
        for (const serverPath of this.servers) {
            if (this.serversData[serverPath]) {
                return _.trim(this.serversData[serverPath], '/');
            }
        }

        return null;
    }

    /**
     * Обращение к API-методу.
     *
     * @param {B} payLoad
     * @param {P} params
     * @param {Object} requestOptions
     * @param {Subject<HttpEvent<R>>} statusSubject
     * @param {number} remainAttemptsNumber
     * @returns {Observable<R>}
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
        statusSubject?: Subject<HttpEvent<R>>
    ): Observable<R> {

        // fixme query не используется
        const query = _.pick(params || {}, this.queryParams);
        const path = _.template(this.pathTemplate)(params || {});
        const server = this.getServerPath();

        // fixme FE App: временное решение для получения строки Query
        const queryString = _(query)
            .map((v, k) => `${k}=` + (_.isArray(query) ? query.join(',') : v))
            .value()
            .join('&');

        if (requestOptions.withCredentials !== false)
            requestOptions.withCredentials = true;

        // !!! По поводу валидаций:
        // Валидации выполняются внутри Observable,
        // чтобы был доступ к subscriber. Тогда ему можно
        // отправить ошибку, которая может быть перехвачена
        // обработчиком запроса в компоненте, но при этом не
        // придется добавлять уровень в Observable.

        // Если для этого сервера указан
        // путь в "белом списке", идет обращение к нему.
        // Иначе — обращение к mock-данным
        if (server) {
            const url = `${server || ''}${path}?${queryString}`;
            const request = new HttpRequest<B>(this.method, url, payLoad, requestOptions);

            return Observable.create((subscriber: Subscriber<R>) => {

                // fixme заголовки не проверяются. надо реализовать

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
            });
        } else {
            return Observable.create((subscriber: Subscriber<R>) => {

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

                // валидация ответа (якобы ответа :)
                && (this._validate(
                    this.mockData,
                    ValidationType.ResponseValidation,
                    subscriber,
                    statusSubject
                ) !== false)

                // Если ошибки валидации не прерывали запрос
                // (зависит от того, как реализован обработчик,
                // подробнее в описании ApiErrorHandler):
                // возврат мокапов.
                && subscriber.next(this.mockData);

                subscriber.complete();
            });
        }
    }

    /**
     * Попытка выполнения запроса, которая может быть повторена.
     * Метод используется для повторных запросов при обработке
     * ошибок, а также, внутри метода `request`.
     * @see request
     *
     * @param {HttpRequest<B>} request
     * @param {Subscriber<R>} subscriber
     * @param {Subject<HttpEvent<R>>} statusSubject
     * @param {HttpErrorResponse} lastError
     * Последняя возникшая ошибка, если это не первая попытка.
     * @param {number} remainAttemptsNumber
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

        this.httpClient.request(request).subscribe(
            (event: HttpEvent<any>) => {
                // отправляется статус загрузки
                if (statusSubject) {
                    statusSubject.next(event);
                }

                // todo надо понять что приходит здесь
                switch (event.type) {
                    case HttpEventType.Sent:
                        break;

                    // fixme дописать другие варианты

                    // Данные получены успешно
                    case HttpEventType.Response:
                        // передача данных подписчику
                        subscriber.next((<HttpResponse<R>>event).body);

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
     * Валидация входных/выходных данных.
     * @param value
     * Значение, которе нужно валидировать.
     * @param type
     * Тип источника данных валидации
     * @returns {void | false}
     * Возвращает false в случае прерывания
     * @private
     */
    protected _validate(
        value: any,
        type: ValidationType,
        subscriber: Subscriber<R>,
        statusSubject: Subject<HttpEvent<R>>
    ): void | false {
        if (!this._ajvCaches) {
            this._ajvCaches = {};
        }

        if (!this.schema[type]) {
            return null;
        } else {
            if (!this._ajvCaches[type]) {
                this._ajvCaches[type] = this._ajvComplier
                    .compile(this.schema[type]);
            }

            const validate = this._ajvCaches[type];
            const isValid = validate(value);

            if (!isValid) {
                const errorData = new ValidationError(
                    `Validation error at: ${type}`,
                    type,
                    this,
                    this.schema[type],
                    value,
                    validate.errors
                );

                const handleResult = this.errorHandler
                    ? this.errorHandler.onValidationError(errorData)
                    : null;

                // todo сделать имитацию событий в statusSubject

                // Если обрабочтик вернул `false`,
                // работа прерывается.
                if (handleResult !== false) {
                    subscriber.error(errorData);
                    return false;
                }
            }
        }
    }

    /**
     * Обработка ошибки.
     *
     * @param {Subscriber<any>} subscriber
     * @private
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

        if (this.errorHandler) {
            this.errorHandler.onHttpError({
                type: error,
                sender: this,
                request,
                originalEvent,
                subscriber,
                statusSubject,
                remainAttemptsNumber
            });
        }
    }
}
