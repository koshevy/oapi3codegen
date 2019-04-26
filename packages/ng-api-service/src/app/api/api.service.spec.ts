import { catchError } from "rxjs/operators";
import * as _ from "lodash";

import { async, fakeAsync, TestBed } from "@angular/core/testing";
import { ApiModule } from "./api.module";
import { ApiService, RequestMetadataResponse } from "./api.service";

import { API_ERROR_HANDLER, ValidationError } from "./providers/event-manager.provider";
import { API_ERROR_PROVIDERS, TESTING_PROVIDERS, apiServices } from './testing.providers';
import { MockRequestData } from "./mocks/request.data";
import {
    HttpClientTestingModule,
    HttpTestingController
} from "@angular/common/http/testing";

import * as requestData from "./mocks/request.data";
import { HttpErrorResponse } from "@angular/common/http";

declare const Error;

describe('API Service test', () => {

    describe('common requests', () => {

        const summaryErrors = [];
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
                        // counting every errors for further check
                        summaryErrors.push('should throw error when request is wrong');

                        expect(err instanceof ValidationError).toBeTruthy();
                        expect(err.sender).toBe(serviceInstance);
                        expect(err.value).toBe(requestMock.wrongRequest);
                        expect(err.type).toBe('request');
                    }
                );
            });
        }));

        // request with wrong params
        it('should throw error when params are wrong', fakeAsync(() => {
            // iterate api-services
            eachApiService((
                serviceInstance: ApiService<any, any, any>,
                requestMock: MockRequestData
            ) => {
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
                        // counting every errors for further check
                        summaryErrors.push('should throw error when params are wrong');

                        expect(err instanceof ValidationError).toBeTruthy();
                        expect(err.sender).toBe(serviceInstance);
                        expect(err.value).toBe(requestMock.wrongParams);
                        expect(err.type).toBe('params');
                    }
                );
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
                        // counting every errors for further check
                        summaryErrors.push('should throw error when response is wrong');
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

                expect(errorThrown).toBeTruthy('Expected validation error');
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

                expect(errorThrown).toBeTruthy('Expected correct error response (500)');
            });
        }));

        // Final check of thrown errors
        it('should contain all errors that had to be thrown', () => {
            expect(summaryErrors).toContain('should throw error when request is wrong');
            expect(summaryErrors).toContain('should throw error when params are wrong');
            expect(summaryErrors).toContain('should throw error when response is wrong');
        });

    });

    describe('requests with error validation handling', () => {

        const summaryErrors = [];
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
                    ...TESTING_PROVIDERS,
                    // Provides mock error handler
                    ...API_ERROR_PROVIDERS
                ]
            }).compileComponents();

            httpTestingController = TestBed.get(HttpTestingController);
        }));

        // request with wrong data (wrong params, wrong body, wrong response),
        // when validation errors handling by API_ERROR_HANDLER / ApiErrorHandler
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
    });
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
    requestMock: MockRequestData
) => void) {
    _.each(apiServices as any, (service: typeof ApiService) => {
        const serviceInstance: ApiService<any, any, any> = TestBed.get(service);
        const requestMock: MockRequestData = requestData[serviceInstance.constructor.name];

        iteratee(serviceInstance, requestMock);
    });
}
