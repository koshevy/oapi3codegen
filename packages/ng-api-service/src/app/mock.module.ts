import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { MockComponent } from './mock.component';

@NgModule({
  declarations: [
    MockComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [MockComponent]
})
export class MockModule { }
