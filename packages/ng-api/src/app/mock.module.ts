import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

/* tslint:disable no-implicit-dependencies */
import { ApiModule } from '@codegena/ng-api-service';
/* tslint:enable no-implicit-dependencies */

import { MockComponent } from './mock.component';
import { MockApiService } from './mock-api';

@NgModule({
    bootstrap: [
        MockComponent
    ],
    declarations: [
        MockComponent
    ],
    imports: [
        ApiModule,
        BrowserModule
    ],
    providers: [
        MockApiService
    ]
})
export class MockModule {
}
