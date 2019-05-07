/**
 * Providers for TestBed-module that has to
 * be used in tests of generated services.
 */

import * as services from '../dist';
import * as _lodash from 'lodash';
const _ = _lodash;

import {
    SERVERS_INFO,
    UrlWhitelistDefinitions
} from './providers/servers.info.provider';

import {
    API_ERROR_HANDLER,
    ApiErrorEventData,
    ApiErrorHandler,
    ValidationError
} from './providers/event-manager.provider';

export const errorHandler: ApiErrorHandler = {
    /**
     * Mock http error handler.
     * Imitates HttpError handler with repeated attempts.
     *
     * @param errorData
     */
    onHttpError(errorData: ApiErrorEventData): void {
        switch (errorData.originalEvent.status) {
            // 500 errors will starts reattempt
            case 500:
                errorData.sender.requestAttempt(
                    errorData.request,
                    errorData.subscriber,
                    errorData.statusSubject,
                    errorData.originalEvent,
                    errorData.remainAttemptsNumber
                );
                break;
            // 502 will stop virtual connections
            case 502:
                errorData.virtualConnectionStatus.next(false);
                setTimeout(() => {
                    errorData.sender.requestAttempt(
                        errorData.request,
                        errorData.subscriber,
                        errorData.statusSubject,
                        errorData.originalEvent,
                        errorData.remainAttemptsNumber
                    );
                });
                break;
            // 404 response will be replaced by success answers
            case 404:
                errorData.subscriber.next({
                    message: 'Not found item you find! Please, continue searching.',
                    status: 404,
                    title: 'Success business-level answer with insignificant error'
                });
                break;
            default:
                throw new Error('Unexpected error code!');
        }
    },
    /**
     * Mock validations error handler. Should just skip error
     * in tests.
     *
     * @param errorData
     * @returns
     */
    onValidationError(errorData: ValidationError): boolean | void {
        return false;
    }
};

export const apiServices = _.values(services);

export const TESTING_PROVIDERS = [
    ...apiServices,
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
            redefines: {
                'http://localhost': 'http://www.some.example.url'
            },
            urlWhitelist: UrlWhitelistDefinitions.ForceToLocalhost
        }
    }
];
