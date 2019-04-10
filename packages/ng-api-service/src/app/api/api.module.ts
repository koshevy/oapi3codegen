import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { ERROR_EVENTS_PROVIDER } from './lib/event-manager.provider';
import { SERVERS_INFO_PROVIDER } from './lib/servers.info.provider';

@NgModule({
    declarations: [],
    imports: [HttpClientModule],
    providers: [
        ERROR_EVENTS_PROVIDER,
        SERVERS_INFO_PROVIDER
    ]
})
export class ApiModule {
}
