import {
    Subject,
    Subscriber
} from 'rxjs';

import {
    InjectionToken,
    EventEmitter
} from '@angular/core';

import {
    HttpRequest,
    HttpErrorResponse, HttpEvent
} from '@angular/common/http';
import { ApiMethodBase } from 'oapi3codegen-agent-angular/api-method.base';

/**
 * Тип API-ошибки.
 */
export enum ApiErrorEventType {
    ConnectionError = 101,
    WrongArgumentSyntax = 400,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    ServerError = 500,
    UnknownError = 1001
}

/**
 * Тип ошибки валидации.
 */
export enum ValidationType {
    RequestValidation = 'request',
    ResponseValidation = 'response',
    ParamsValidation = 'params'
}

/**
 * Данные глобального события API.
 */
export interface ApiErrorEventData {
    /**
     *  Тип ошибки
     */
    type: ApiErrorEventType;

    /**
     * Отправитель запроса.
     * todo нужно связать с ApiMethodBase. для этого надо вынести это в интерфейс
     */
    sender: any;

    /**
     * Запрос, который не удалось отправить.
     * Можно попробовать повторить запрос, но, например,
     * с измененными авторизационными данными.
     */
    request: HttpRequest<any>;

    /**
     * Подписчик, ожидающий выполнения этого запроса
     */
    subscriber: Subscriber<any>;

    /**
     * Оригинальное Http-событие от Angular
     */
    originalEvent: HttpErrorResponse;

    /**
     * Канал для подписки на изменение статуса при запросе
     */
    statusSubject: Subject<HttpEvent<any>>;

    /**
     * Количество оставшихся попыток
     */
    remainAttemptsNumber: number;
}

/**
 * Событие, сообщающее об ошибках валидации.
 */
export class ValidationError {

    constructor(
        public message: string,

        /**
         *  Тип ошибки
         */
        public type: ValidationType,

        /**
         * Отправитель запроса.
         * todo нужно связать с ApiMethodBase. для этого надо вынести это в интерфейс
         */
        public sender: any,

        /**
         * Схема, с помощью которой производилась валидация.
         */
        public schema: any,

        /**
         * Значение, которое не прошло валидацию.
         */
        public value: any,

        /**
         * Сообщения об ошибках валидации.
         */
        public errorMessages: string[]
    ) {}
}

/**
 * Обработчик ошибок API.
 * Предполагает только один вариант обработчика,
 * чтобы не иметь конфликтов нескольких обработчиков.
 */
export interface ApiErrorHandler {

    /**
     * Обработчик HTTP-ошибок, возникающих при неправильном
     * ответе от сервера (или неудаче получения ответа).
     * @param {ApiErrorEventData} errorData
     */
    onHttpError(errorData: ApiErrorEventData): void;

    /**
     * Обработчик ошибок валидации.
     * Если возвращает `false`, запрос прерывается и возникает
     * ошибка.
     * @param {ValidationError} errorData
     */
    onValidationError(errorData: ValidationError): boolean | void;
}

/**
 * Канал, показывающий, что нужно сбросить подписки на
 * действия API.
 * @type {Subject<any>}
 */
export const resetApiEvents = new Subject<any>();

/**
 * Поток для привязки к нему отмены подписки на текущие запросы.
 * todo нужно решить как его использовать (и стоит ли)
 * @type {InjectionToken<Subject<any>>}
 */
export const RESET_API_EVENTS = new InjectionToken<Subject<any>>('ResetApiEvents');

/**
 * Токен для внедрения  менеджера ошибок, который будет
 * обрабатывать глобальные события.
 * @type {InjectionToken<EventManager>}
 */
export const API_ERROR_HANDLER = new InjectionToken<ApiErrorHandler>('ApiErrorHandler');


export const ERROR_EVENTS_PROVIDER = [
    {
        provide: RESET_API_EVENTS,
        useValue: resetApiEvents
    },
    {
        // по-умолчанию, обработчиков нет
        provide: API_ERROR_HANDLER,
        useValue: null
    }
];
