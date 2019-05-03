import { catchError } from "rxjs/operators";
import * as _ from "lodash";

import { async, fakeAsync, TestBed } from "@angular/core/testing";
import { ApiModule } from "./api.module";
import { ApiService, RequestMetadataResponse } from "./api.service";

import {
    ApiErrorHandler,
    ValidationError,
    RESET_API_SUBSCRIBERS
} from "./providers/event-manager.provider";

import {
    API_ERROR_PROVIDERS,
    TESTING_PROVIDERS,
    URL_REPLACE_PROVIDERS,
    apiServices
} from './testing.providers';
import { MockRequestData } from "./mocks/request.data";
import {
    HttpClientTestingModule,
    HttpTestingController
} from "@angular/common/http/testing";

import * as requestData from "./mocks/request.data";

import { HttpErrorResponse } from "@angular/common/http";
import { RequestSender } from "./providers/request-sender";
import { Subject } from "rxjs/internal/Subject";
import { ServersInfo, SERVERS_INFO } from "./providers/servers.info.provider";

declare const Error;

describe('API Service test', () => {

    describe('common requests', () => {

        let httpTestingController: HttpTestingController;

        // Provide auto-generated services into module
        beforeEach(async(() => {
            TestBed.configureTestingModule({
                declarations: [],
                imports: [
                    ApiModule,
                    HttpClientTestingModule
                ],
                providers: [
                    ...TESTING_PROVIDERS
                ]
            }).compileComponents();

            httpTestingController = TestBed.get(HttpTestingController);
        }));

        // Check the API-services injected successfully
        // and module can provide access to every of these
        it('should be successfully injected', () => {
            eachApiService((serviceInstance) => {
                expect(serviceInstance instanceof ApiService).toBeTruthy();
            });
        });

        // request with correct data
        it('should do successful request', fakeAsync(() => {
            // iterate api-services
            eachApiService((
                serviceInstance: ApiService<any, any, any>,
                requestMock: MockRequestData
            ) => {
                const requestMetadata: RequestMetadataResponse = {};

                // do testing request
                serviceInstance.request(
                    requestMock.request,
                    requestMock.params,
                    {},
                    null,
                    requestMetadata
                ).subscribe(
                    (response) => {
                        expect(response).toBe(requestMock.response);
                    },
                    err => fail(err)
                );

                // find last sent request
                const [testRequest] = httpTestingController.match({
                    method: requestMetadata.request.method,
                    url: requestMetadata.url
                });

                expect(testRequest.request.url).toMatch(/^http:\/\/localhost/);
                // send mock answer to subscriber of request
                testRequest.flush(requestMock.response);
            });
        }));

        // request with wrong request (body)
        it('should throw error when request is wrong', fakeAsync(() => {
            // iterate api-services
            eachApiService((
                serviceInstance: ApiService<any, any, any>,
                requestMock: MockRequestData
            ) => {
                let errorThrown;

                // do testing request
                serviceInstance.request(
                    requestMock.wrongRequest,
                    requestMock.params,
                    {},
                    null
                ).subscribe(
                    (response) => {
                        fail(new Error('Request should not be accomplished due request validation error'));
                    },
                    (err: ValidationError) => {
                        // counting every expected error for further check
                        errorThrown = true;

                        expect(err instanceof ValidationError).toBeTruthy();
                        expect(err.sender).toBe(serviceInstance);
                        expect(err.value).toBe(requestMock.wrongRequest);
                        expect(err.type).toBe('request');
                    }
                );

                expect(errorThrown).toBeTruthy('Expected request validation error');
            });
        }));

        // request with wrong params
        it('should throw error when params are wrong', fakeAsync(() => {
            // iterate api-services
            eachApiService((
                serviceInstance: ApiService<any, any, any>,
                requestMock: MockRequestData
            ) => {
                let errorThrown;

                // do testing request
                serviceInstance.request(
                    requestMock.request,
                    requestMock.wrongParams,
                    {},
                    null
                ).subscribe(
                    (response) => {
                        fail(new Error('Request should not be accomplished due params validation error'));
                    },
                    (err: ValidationError) => {
                        // counting every expected error for further check
                        errorThrown = true;

                        expect(err instanceof ValidationError).toBeTruthy();
                        expect(err.sender).toBe(serviceInstance);
                        expect(err.value).toBe(requestMock.wrongParams);
                        expect(err.type).toBe('params');
                    }
                );

                expect(errorThrown).toBeTruthy('Expected params validation error');
            });
        }));

        // request with wrong responses
        it('should throw error when response is wrong', fakeAsync(() => {
            // iterate api-services
            eachApiService((
                serviceInstance: ApiService<any, any, any>,
                requestMock: MockRequestData
            ) => {
                const requestMetadata: RequestMetadataResponse = {};
                let errorThrown: boolean;

                // do testing request
                serviceInstance.request(
                    requestMock.request,
                    requestMock.params,
                    {},
                    null,
                    requestMetadata
                ).subscribe(
                    (response) => {
                        // expect(response).toBe(requestMock.response);
                        fail(new Error('Request should not be accomplished due response validation error'));
                    },
                    (err: ValidationError) => {
                        // counting every expected error for further check
                        errorThrown = true;

                        expect(err instanceof ValidationError).toBeTruthy();
                        expect(err.sender).toBe(serviceInstance);
                        expect(err.value).toBe(requestMock.wrongResponse);
                        expect(err.type).toBe('response');
                    }
                );

                // find last sent request
                const [testRequest] = httpTestingController.match({
                    method: requestMetadata.request.method,
                    url: requestMetadata.url
                });

                // send mock answer to subscriber of request (with wrong response)
                testRequest.flush(requestMock.wrongResponse);

                expect(errorThrown).toBeTruthy('Expected response validation error');
            });
        }));

        // request with correct error responses (500)
        it('should get correct error response (500)', fakeAsync(() => {
            // iterate api-services
            eachApiService((
                serviceInstance: ApiService<any, any, any>,
                requestMock: MockRequestData
            ) => {
                const requestMetadata: RequestMetadataResponse = {};
                let errorThrown: boolean;

                // do testing request
                serviceInstance.request(
                    requestMock.request,
                    requestMock.params,
                    {},
                    null,
                    requestMetadata
                ).subscribe(
                    (response) => fail('Expected error response'),
                    (err: HttpErrorResponse) => {
                        // counting every expected error for further check
                        errorThrown = true;

                        expect(err instanceof HttpErrorResponse).toBe(
                            true,
                            'Expected HttpErrorResponse!'
                        );
                        expect(err.error).toBe(requestMock.errorResponse);
                    }
                );

                // find last sent request
                const [testRequest] = httpTestingController.match({
                    method: requestMetadata.request.method,
                    url: requestMetadata.url
                });

                // send mock answer to subscriber of request (with wrong response)
                testRequest.flush(requestMock.errorResponse, {
                    status: 500,
                    statusText: 'Fake server error'
                });

                expect(errorThrown).toBeTruthy('Expected correct error response (500)');
            });
        }));

        // request with wrong error responses (500)
        it('should get wrong error response (500)', fakeAsync(() => {
            // iterate api-services
            eachApiService((
                serviceInstance: ApiService<any, any, any>,
                requestMock: MockRequestData
            ) => {
                const requestMetadata: RequestMetadataResponse = {};
                let errorThrown: boolean;

                // do testing request
                serviceInstance.request(
                    requestMock.request,
                    requestMock.params,
                    {},
                    null,
                    requestMetadata
                ).subscribe(
                    (response) => fail('Expected error response'),
                    (err: ValidationError) => {
                        // counting every expected error for further check
                        errorThrown = true;

                        expect(err instanceof ValidationError).toBe(
                            true,
                            'Expected ValidationError!'
                        );
                        expect(err.sender).toBe(serviceInstance);
                        expect(err.value).toBe(requestMock.wrongResponse);
                        expect(err.type).toBe('response');
                    }
                );

                // find last sent request
                const [testRequest] = httpTestingController.match({
                    method: requestMetadata.request.method,
                    url: requestMetadata.url
                });

                // send mock answer to subscriber of request (with wrong response)
                testRequest.flush(requestMock.wrongResponse, {
                    status: 500,
                    statusText: 'Fake server error'
                });

                expect(errorThrown).toBeTruthy('Expected wrong error response (500)');
            });
        }));
    });

    describe('requests with error handling', () => {

        let httpTestingController: HttpTestingController;
        let resetApiSubscribers;

        // Provide auto-generated services into module
        beforeEach(async(() => {
            TestBed.configureTestingModule({
                declarations: [],
                imports: [
                    ApiModule,
                    HttpClientTestingModule
                ],
                providers: [
                    ...TESTING_PROVIDERS,
                    // Provides mock error handler
                    ...API_ERROR_PROVIDERS
                ]
            }).compileComponents();

            httpTestingController = TestBed.get(HttpTestingController);
            resetApiSubscribers = TestBed.get(RESET_API_SUBSCRIBERS);
        }));

        // request with wrong data (wrong params, wrong body, wrong response),
        // when validation errors handling on by API_ERROR_HANDLER / ApiErrorHandler
        it('should pass over validation errors', fakeAsync(() => {
            // iterate api-services
            eachApiService((
                serviceInstance: ApiService<any, any, any>,
                requestMock: MockRequestData
            ) => {
                const requestMetadata: RequestMetadataResponse = {};
                let gotResponse: boolean;

                // do testing request
                serviceInstance.request(
                    requestMock.wrongRequest,
                    requestMock.wrongResponse,
                    {},
                    null,
                    requestMetadata
                ).subscribe(
                    (response) => {
                        expect(response).toBe(requestMock.wrongResponse);
                        gotResponse = true;
                    },
                    (err: ValidationError) => {
                        err => {
                            console.error(err);
                            fail(new Error('Should not throw error when validation falls!'));
                        }
                    }
                );

                // find last sent request
                const [testRequest] = httpTestingController.match({
                    method: requestMetadata.request.method,
                    url: requestMetadata.url
                });

                // send mock answer to subscriber of request (with wrong response)
                testRequest.flush(requestMock.wrongResponse);
                expect(gotResponse).toBeTruthy('It seems, subscriber did\'t get a success answer');
            });
        }));

        /**
         * HttpErrors might be handled by {@link ApiErrorHandler}.
         * Request with error might be resended by {@link RequestSender.requestAttempt},
         * but there is only 10 attempts to repeat (by default). And 10's attempt
         * throws error.
         */
        it('should handle HTTP error by ApiErrorHandler 9 times and then throw error', fakeAsync(() => {
            // iterate api-services
            eachApiService((
                serviceInstance: ApiService<any, any, any>,
                requestMock: MockRequestData
            ) => {
                const requestMetadata: RequestMetadataResponse = {};
                let expectedErrorThrown: boolean = false;

                // do testing request
                serviceInstance.request(
                    requestMock.request,
                    requestMock.params,
                    {},
                    null,
                    requestMetadata
                ).subscribe(
                    (response) => fail('Expected error response'),
                    (err: HttpErrorResponse) => {
                        expect(expectedErrorThrown).toBeFalsy(
                            'Error should be thrown only once'
                        );
                        expect(err instanceof HttpErrorResponse).toBe(
                            true,
                            'Expected HttpErrorResponse!'
                        );

                        // Only 10's attempts should throw error:
                        // when all attempts gone
                        expect(err.statusText).toBe('Fake server error #10');
                        expect(err.status).toBe(500);
                        expect(err.error).toBe(requestMock.wrongResponse);

                        expectedErrorThrown = true;
                    }
                );

                // Do 10 attempts
                _.times(10, attempt => {
                    // find last sent request
                    const [testRequest] = httpTestingController.match({
                        method: requestMetadata.request.method,
                        url: requestMetadata.url
                    });

                    // send mock answer to subscriber of request (with wrong response)
                    testRequest.flush(requestMock.wrongResponse, {
                        status: 500,
                        statusText: `Fake server error #${attempt + 1}`
                    });
                });

                // Last (10) attempt should throw error
                expect(expectedErrorThrown).toBeTruthy(
                    'Expected HttpErrorResponse at attempt number 10'
                );
            });
        }));

        it('should handle HTTP error and replace with successful response', fakeAsync(() => {
            // iterate api-services
            eachApiService((
                serviceInstance: ApiService<any, any, any>,
                requestMock: MockRequestData
            ) => {
                const requestMetadata: RequestMetadataResponse = {};
                let gotResponse: boolean;

                // do testing request
                serviceInstance.request(
                    requestMock.request,
                    requestMock.params,
                    {},
                    null,
                    requestMetadata
                ).subscribe(
                    (response: { status, title }) => {
                        expect(response.status).toBe(404);
                        expect(response.title).toBe(
                            'Success business-level answer with insignificant error'
                        );
                        gotResponse = true;
                    },
                    (err) => fail('There is should no errors!')
                );

                // find last sent request
                const [testRequest] = httpTestingController.match({
                    method: requestMetadata.request.method,
                    url: requestMetadata.url
                });

                // send mock answer to subscriber of request with 404 error
                testRequest.error(null, {
                    status: 404,
                    statusText: 'A terrible server side error with 404 status!'
                });
                expect(gotResponse).toBeTruthy(
                    'It seems, subscriber did\'t get a success answer'
                );
            });
        }));

        it('should cancel all subscribers by "timeout"', fakeAsync(() => {
            // iterate api-services
            eachApiService((
                serviceInstance: ApiService<any, any, any>,
                requestMock: MockRequestData
            ) => {
                const requestMetadata: RequestMetadataResponse = {};
                let gotComplete: boolean;

                // do testing request
                serviceInstance.request(
                    requestMock.request,
                    requestMock.params,
                    {},
                    null,
                    requestMetadata
                ).subscribe(
                    () => fail('There is should be no response!'),
                    (err) => fail('There are should be no errors!'),
                    () => gotComplete = true
                );

                // Reset all API subscribers!
                resetApiSubscribers.next();

                // find last sent request
                const [testRequest] = httpTestingController.match({
                    method: requestMetadata.request.method,
                    url: requestMetadata.url
                });

                expect(testRequest.cancelled).toBeTruthy(
                    'Request should be complete!'
                );
                expect(gotComplete).toBeTruthy(
                    'Subscribers was not complete!'
                );
            });
        }));
    });

    describe('requests with URL redefines', () => {

        let httpTestingController: HttpTestingController;
        let resetApiSubscribers: Subject<void>;
        let serversInfo: ServersInfo

        // Provide auto-generated services into module
        beforeEach(async(() => {
            TestBed.configureTestingModule({
                declarations: [],
                imports: [
                    ApiModule,
                    HttpClientTestingModule
                ],
                providers: [
                    ...TESTING_PROVIDERS,
                    ...URL_REPLACE_PROVIDERS
                ]
            }).compileComponents();

            httpTestingController = TestBed.get(HttpTestingController);
            resetApiSubscribers = TestBed.get(RESET_API_SUBSCRIBERS);
            serversInfo = TestBed.get(SERVERS_INFO);
        }));

        it('testing common URL redefine', fakeAsync(() => {
            // iterate api-services
            eachApiService((
                serviceInstance: ApiService<any, any, any>,
                requestMock: MockRequestData
            ) => {
                const requestMetadata: RequestMetadataResponse = {};
                let gotComplete: boolean;

                // do testing request
                serviceInstance.request(
                    requestMock.request,
                    requestMock.params,
                    {},
                    null,
                    requestMetadata
                ).subscribe(
                    () => fail('There is should be no response!'),
                    (err) => fail('There are should be no errors!'),
                    () => gotComplete = true
                );

                // find last sent request
                const [testRequest] = httpTestingController.match({
                    method: requestMetadata.request.method,
                    url: requestMetadata.url
                });

                expect(testRequest.request.url).toMatch(
                    /^http:\/\/www\.some\.examle\.url/
                );

                // close subscriptions
                resetApiSubscribers.next();
                resetApiSubscribers.complete();
            });
        }));

        it('testing URL redefine for certain service', fakeAsync(() => {
            // iterate api-services
            eachApiService((
                serviceInstance: ApiService<any, any, any>,
                requestMock: MockRequestData,
                serviceClass: typeof ApiService
            ) => {
                const requestMetadata: RequestMetadataResponse = {};

                /**
                 * Manual injection redefine of URL for serviceClass.
                 * @see ServersInfo.customRedefines
                 * @type {[{serviceClass: ApiService; serverUrl: string}]}
                 */
                serversInfo.customRedefines = [
                    {
                        serviceClass: serviceClass,
                        serverUrl: 'http://www.some.examle.url/redefine'
                    }
                ];

                // do testing request
                serviceInstance.request(
                    requestMock.request,
                    requestMock.params,
                    {},
                    null,
                    requestMetadata
                ).subscribe(
                    () => fail('There is should be no response!'),
                    (err) => fail('There are should be no errors!')
                );

                // find last sent request
                const [testRequest] = httpTestingController.match({
                    method: requestMetadata.request.method,
                    url: requestMetadata.url
                });

                // Checks whether URL was redefined or not
                expect(testRequest.request.url).toMatch(
                    /^http:\/\/www\.some\.examle\.url\/redefine/
                );

                // close subscriptions
                resetApiSubscribers.next();
                resetApiSubscribers.complete();
            });
        }));
    });

    // todo StatusSubject tests
});

/**
 * Helper: gets list of automatic generated services,
 * gets instance of each of them and theirs mock,
 * and put into `iteratee`.
 *
 * `iteratee` will be for every service instance.
 *
 * @param {(serviceInstance: ApiService<any, any, any>, requestMock: MockRequestData) => void} iteratee
 */
function eachApiService(iteratee: (
    serviceInstance: ApiService<any, any, any>,
    requestMock: MockRequestData,
    serviceClass?: typeof ApiService
) => void) {
    _.each(apiServices as any, (service: typeof ApiService) => {
        const serviceInstance: ApiService<any, any, any> = TestBed.get(service);
        const requestMock: MockRequestData = requestData[serviceInstance.constructor.name];

        iteratee(serviceInstance, requestMock, service);
    });
}
