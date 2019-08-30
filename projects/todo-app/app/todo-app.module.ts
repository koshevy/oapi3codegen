import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import {
    ApiModule,
    API_ERROR_HANDLER
} from '@codegena/ng-api-service';

import { TodoAppRoutingModule } from './todo-app-routing.module';
import { TodoAppComponent } from './todo-app.component';
import { TodosGroupComponent } from './todos-groups/todos-group.component';
import { NoInternetComponent } from './todos-groups/no-internet/no-internet.component';

import {
    DeleteGroupService,
    GetGroupsService,
    CreateGroupService,
    UpdateGroupService
} from './api/services';
import { EditGroupComponent } from './todos-groups/edit-group/edit-group.component';
import { JsonValidationService } from './lib/json-validation.service';
import { ToasterService } from './lib/toaster.service';
import { ApiErrorHandlerService } from './lib/api-error-handler.service';
import { ConfirmationComponent } from './confirmation/confirmation.component';
import { ConfirmationService } from './confirmation/confirmation.service';

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
        NoInternetComponent,
        NullableAccessorDirective,
        TodoAppComponent,
        TodosGroupComponent,
        ConfirmationComponent,
    ],
    entryComponents: [
        EditGroupComponent,
        ConfirmationComponent
    ],
    exports: [
        TodoAppComponent,
        ConfirmationComponent
    ],
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
        DragDropModule,
        MatBottomSheetModule,
        MatIconModule,
        MatListModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        OverlayModule
    ],
    providers: [
        ConfirmationService,
        CreateGroupService,
        DeleteGroupService,
        GetGroupsService,
        JsonValidationService,
        UpdateGroupService,
        ToasterService,
        ERROR_DIRECTIVE_FLASH_PROVIDER,
        {
            provide: API_ERROR_HANDLER,
            useClass: ApiErrorHandlerService
        }
    ]
})
export class TodoAppModule { }
