import * as _lodash from 'lodash';
const _ = _lodash;

import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { async, fakeAsync, TestBed } from '@angular/core/testing';
import {
    HttpClientTestingModule,
    HttpTestingController,
    TestRequest
} from '@angular/common/http/testing';

import {
    ApiModule,
    RequestMetadataResponse,
    pickResponseBody,
    tapResponse
} from '@codegena/ng-api-service';

// Services
import { CreateListService } from './prepare-dist/services';
import {
    CreateListRequest,
    CreateListResponse,
    ToDosList,
    ToDosListBlank,
    ToDosItem
} from './prepare-dist/typings';

describe('Test of integration generated services into external project', () => {
    let httpTestingController: HttpTestingController;

    // Provide auto-generated services into module
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                ApiModule,
                HttpClientTestingModule
            ],
            providers: [
                CreateListService
            ]
        }).compileComponents();

        httpTestingController = TestBed.get(HttpTestingController);
    }));

    it('POST request from `CreateListService`', () => {
        const requestMetadata: RequestMetadataResponse = {};
        const service: CreateListService = TestBed.get(CreateListService);
        const todoListResult: ToDosList = {
            dateChanged: '2019-06-02T09:00:12+00:00',
            dateCreated: '2019-06-02T09:00:12+00:00',
            description: 'List contains some home home tasks at weekend',
            isComplete: false,
            items: [
                {
                    dateChanged: '2019-06-02T09:00:12+00:00',
                    dateCreated: '2019-06-02T09:00:12+00:00',
                    isDone: false,
                    listUid: 1,
                    position: 0,
                    title: 'Remove default example tasks',
                    uid: 0
                },
                {
                    dateChanged: '2019-06-02T09:00:12+00:00',
                    dateCreated: '2019-06-02T09:00:12+00:00',
                    isDone: false,
                    listUid: 1,
                    position: 0,
                    title: 'Make own real tasks',
                    uid: 1
                },
                {
                    dateChanged: '2019-06-02T09:00:12+00:00',
                    dateCreated: '2019-06-02T09:00:12+00:00',
                    isDone: false,
                    listUid: 1,
                    position: 0,
                    title: 'Change list title',
                    uid: 3
                },
                {
                    dateChanged: '2019-06-02T09:00:12+00:00',
                    dateCreated: '2019-06-02T09:00:12+00:00',
                    isDone: false,
                    listUid: 1,
                    position: 0,
                    title: 'Change list description',
                    uid: 14
                }
            ],
            title: 'First todo list',
            uid: 1,
        };

        service.request(
            _.pick(
                todoListResult,
                ['description', 'items', 'title', 'isComplete']
            ),
            null,
            {},
            null,
            requestMetadata
        ).pipe(
            pickResponseBody<CreateListResponse<201>>(
                201,
                'application/json',
                true
            )
        ).subscribe(result => {
            expect(result).toEqual(
                todoListResult,
                'Wrong response'
            );
        });

        console.log('requestMetadata', requestMetadata);

        // find last sent request
        const [testRequest] = httpTestingController.match({
            method: requestMetadata.request.method,
            url: requestMetadata.url
        });

        // send mock answer to subscriber of request
        testRequest.flush(_.cloneDeep(todoListResult), {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
            }),
            status: 201,
            statusText: 'Has added'
        });
    });

    // TODO make test for rest services
});
