import { async, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

import * as _ from 'lodash';

import { ApiModule } from './api/api.module';
import { ApiService } from './api/api.service';
import { SERVERS_INFO, UrlWhitelistDefinitions } from "./api/lib/servers.info.provider";

import * as requestData from './api/mocks/request.data';
import { MockRequestData } from './api/mocks/request.data';
import * as petShopData from './api/mocks/specs/pet-shop.json';
import * as services from './api/dist';


const pageTitle = 'Result of request to an API';

describe('Prepare test application', () => {

    // Provide auto-generated services into module
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                AppComponent
            ],
            imports: [
                ApiModule
            ],
            providers: [
                _.values(services),
                {
                    provide: SERVERS_INFO,
                    useValue: {
                        urlWhitelist: UrlWhitelistDefinitions.ForceToLocalhost
                    }

                }
            ]
        }).compileComponents();
    }));

    it('should create the app', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app).toBeTruthy();
    });

    it('should get access to generated API services', () => {
        _.each(_.values(services) as any, (service: typeof ApiService) => {
            const serviceInstance: ApiService<any, any, any> = TestBed.get(service);
            expect(serviceInstance instanceof ApiService).toBeTruthy();
        });
    });

    it('should get access to generated API services', () => {
        _.each(_.values(services) as any, (service: typeof ApiService) => {
            const serviceInstance: ApiService<any, any, any> = TestBed.get(service);
            expect(serviceInstance instanceof ApiService).toBeTruthy();
        });
    });

    it('should do successful request', async(() => {
        _.each(_.values(services) as any, (service: typeof ApiService) => {
            const serviceInstance: ApiService<any, any, any> = TestBed.get(service);
            const curRequestData: MockRequestData = requestData[serviceInstance.constructor.name];

            expect(serviceInstance instanceof ApiService).toBeTruthy();

            serviceInstance.request(
                curRequestData.request,
                curRequestData.params
            ).subscribe(
                (response) => {
                    // ...
                }
            )
        });
    }));
});
