import { async, TestBed, ComponentFixture } from '@angular/core/testing';
import {
    HttpClientTestingModule,
    HttpTestingController
} from '@angular/common/http/testing';

import { MockComponent } from './mock.component';
import { MockApiService } from './mock-api';

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
    let mockComponentFixture: ComponentFixture<MockComponent>;
    let mockComponent: MockComponent;
    let httpTestingController: HttpTestingController;

    // Provide auto-generated services into module
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                MockComponent
            ],
            imports: [
                ApiModule,
                HttpClientTestingModule
            ],
            providers: [
                MockApiService,
                {
                    provide: SERVERS_INFO,
                    useValue: {
                        urlWhitelist: UrlWhitelistDefinitions.AllowAll
                    }
                }
            ]
        }).compileComponents();

        httpTestingController = TestBed.get(HttpTestingController);
        mockComponentFixture = TestBed.createComponent(MockComponent);
        mockComponent = mockComponentFixture.componentInstance;
    }));

    it('should be successfully injected ApiService-based service', () => {
        expect(mockComponent.mockApiService instanceof ApiService).toBeTruthy(
            'Expected successful injection of ApiService-based service'
        );
    });

    it('should get properly data', () => {
        mockComponentFixture.detectChanges();
    });
});
