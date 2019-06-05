import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

/* tslint:disable no-implicit-dependencies */
import { ApiModule } from '@codegena/ng-api-service';
/* tslint:enable no-implicit-dependencies */

import { MockComponent } from './mock.component';

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
    ]
})
export class MockModule {
}
