/**
 * Providers for TestBed-module that has to
 * be used in tests of generated services.
 */

import * as services from "./dist";
import * as _ from "lodash";
import {
    SERVERS_INFO,
    UrlWhitelistDefinitions
} from "./providers/servers.info.provider";

import {
    API_ERROR_HANDLER,
    ApiErrorEventData,
    ApiErrorHandler,
    ValidationError
} from "./providers/event-manager.provider";

export const errorHandler: ApiErrorHandler = {
    /**
     * Mock http error handler.
     * Imitates HttpError handler with repeated attempts.
     *
     * @param {ApiErrorEventData} errorData
     */
    onHttpError(errorData: ApiErrorEventData): void {
        // 500 errors will starts reattempt
        if (errorData.originalEvent.status === 500) {
            errorData.sender.requestAttempt(
                errorData.request,
                errorData.subscriber,
                errorData.statusSubject,
                errorData.originalEvent,
                errorData.remainAttemptsNumber
            );
        } else {
            // 404 response will be replaced by success answers
            errorData.subscriber.next({
                status: 404,
                title: 'Success business-level answer with insignificant error',
                message: 'Not found item you find! Please, continue searching.'
            });
        }
    },
    /**
     * Mock validations error handler. Should just skip error
     * in tests.
     *
     * @param {ValidationError} errorData
     * @returns {boolean | void}
     */
    onValidationError(errorData: ValidationError): boolean | void {
        return false;
    }
};

export const apiServices = _.values(services);

export const TESTING_PROVIDERS = [
    ... apiServices,
    {
        provide: SERVERS_INFO,
        useValue: {
            urlWhitelist: UrlWhitelistDefinitions.ForceToLocalhost
        }
    }
];

export const API_ERROR_PROVIDERS = [
    {
        // по-умолчанию, обработчиков нет
        provide: API_ERROR_HANDLER,
        useValue: errorHandler
    }
];

export const URL_REPLACE_PROVIDERS = [
    {
        provide: SERVERS_INFO,
        useValue: {
            urlWhitelist: UrlWhitelistDefinitions.ForceToLocalhost,
            redefines: {
                'http://localhost': 'http://www.some.examle.url'
            }
        }
    }
];
