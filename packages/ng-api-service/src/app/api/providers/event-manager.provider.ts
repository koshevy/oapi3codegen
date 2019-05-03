import {
    Subject,
    Subscriber
} from 'rxjs';

import {  InjectionToken  } from '@angular/core';
import {
    HttpRequest,
    HttpErrorResponse, HttpEvent
} from '@angular/common/http';

import { RequestSender } from './request-sender';

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
     */
    sender: RequestSender;

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
         * todo нужно связать с ApiService. для этого надо вынести это в интерфейс
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
        public errorMessages: string[] | any[]
    ) {}
}

/**
 * The primary use of {@link ApiErrorHandler} is a handling
 * validation errors and http errors after validation of response.
 * For instance, error response with status 500 have to be validated
 * before, and throws {@link ValidationError} error when validation fails.
 */
export interface ApiErrorHandler {
    /**
     * Handles HTTP-error after validation of response check.
     * @param {ApiErrorEventData} errorData
     */
    onHttpError(errorData: ApiErrorEventData): void;

    /**
     * When returns `false`, error skips.
     * @param {ValidationError} errorData
     */
    onValidationError(errorData: ValidationError): boolean | void;
}

/**
 * Канал, показывающий, что нужно сбросить подписки на
 * действия API.
 * @type {Subject<any>}
 */
export const resetApiSubscribers = new Subject<any>();

/**
 * Поток для привязки к нему отмены подписки на текущие запросы.
 * todo нужно решить как его использовать (и стоит ли)
 * @type {InjectionToken<Subject<any>>}
 */
export const RESET_API_SUBSCRIBERS = new InjectionToken<Subject<any>>('RESET_API_SUBSCRIBERS');

/**
 * Токен для внедрения  менеджера ошибок, который будет
 * обрабатывать глобальные события.
 * @type {InjectionToken<EventManager>}
 */
export const API_ERROR_HANDLER = new InjectionToken<ApiErrorHandler>('API_ERROR_HANDLER');

export const ERROR_EVENTS_PROVIDER = [
    {
        provide: RESET_API_SUBSCRIBERS,
        useValue: resetApiSubscribers
    },
    {
        // по-умолчанию, обработчиков нет
        provide: API_ERROR_HANDLER,
        useValue: null
    }
];
