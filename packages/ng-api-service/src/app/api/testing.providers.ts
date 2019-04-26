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
    onHttpError(errorData: ApiErrorEventData): void {
        console.log('*** errorHandler', errorData);
    },
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