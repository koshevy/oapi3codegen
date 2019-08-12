import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ApiModule } from '@codegena/ng-api-service';

import { TodoAppRoutingModule } from './todo-app-routing.module';
import { TodoAppComponent } from './todo-app.component';
import { TodosListComponent } from './todos-list/todos-list.component';

import { GetListsService, CreateListService } from './api/services';
import { EditGroupComponent } from './todos-list/edit-group/edit-group.component';
import { JsonValidationService } from './lib/json-validation.service';

// Directives

import {
    ErrorValidationDirective,
    ERROR_DIRECTIVE_FLASH_PROVIDER
} from './lib/error-validation.directive';
import { NullableAccessorDirective } from './lib/nullable-accessor';

@NgModule({
    bootstrap: [TodoAppComponent],
    declarations: [
        EditGroupComponent,
        ErrorValidationDirective,
        NullableAccessorDirective,
        TodoAppComponent,
        TodosListComponent,
    ],
    entryComponents: [EditGroupComponent],
    exports: [TodoAppComponent],
    imports: [
        ApiModule,
        RouterModule.forRoot([]),
        CommonModule,
        TodoAppRoutingModule,
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule,
        NgbModule,
        MatBottomSheetModule,
        MatIconModule
    ],
    providers: [
        CreateListService,
        GetListsService,
        JsonValidationService,
        ERROR_DIRECTIVE_FLASH_PROVIDER
    ]
})
export class TodoAppModule { }
