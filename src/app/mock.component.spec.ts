import { async, TestBed, ComponentFixture } from '@angular/core/testing';
import {
    HttpClientTestingModule,
    HttpTestingController
} from '@angular/common/http/testing';

import { MockComponent } from './mock.component';

/* tslint:disable no-implicit-dependencies */
import {
    ApiModule,
    ApiService,
    SERVERS_INFO,
    UrlWhitelistDefinitions
} from '@codegena/ng-api-service';
// import { MockRequestData } from '@codegena/ng-api-service/mocks/request.data';
/* tslint:enable no-implicit-dependencies */

describe('Correct integration of `@codegena/ng-api-service` in external project', () => {
    // TODO do tests of mock component, or remove mock component
});
