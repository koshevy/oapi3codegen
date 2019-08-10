import {
  Component,
  OnInit,
  ChangeDetectionStrategy
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { tapResponse, pickResponseBody } from '@codegena/ng-api-service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

import {
    BehaviorSubject,
    Observable
} from 'rxjs';
import {
    distinctUntilChanged,
    map,
    mergeMap,
    share,
    tap
} from 'rxjs/operators';

import * as _ from 'lodash';

import { ToDosList, GetListsResponse } from '../api/typings';
import { GetListsService } from '../api/services';

import { EditGroupComponent } from './edit-group/edit-group.component';

interface InParams {
    isComplete: boolean | null;
    isCurrentList: number | null;
}

/**
 * Teaser of ToDos list in common list of this component.
 * Shows both of already created and new optimistically added,
 * but not created yet in fact.
 */
interface ToDosListTeaser extends ToDosList {
    /**
     * Marks that TodosList added to lists optimistically.
     */
    optimistic?: boolean;
}

interface CompleteContext {
    lists: ToDosListTeaser[];
    isComplete: boolean | null;
    isCurrentList: number | null;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lib-todos-list',
  styleUrls: ['./todos-list.component.scss'],
  templateUrl: './todos-list.component.html'
})
export class TodosListComponent implements OnInit {

    inParams$: Observable<InParams>;
    context$: Observable<ToDosListTeaser[]>;

    constructor(
        public activatedRoute: ActivatedRoute,
        public getListsService: GetListsService,
        protected matBottomSheet: MatBottomSheet
    ) {
        /**
         * Define of input component params.
         */
        this.inParams$ = this.activatedRoute.queryParams.pipe(
            distinctUntilChanged(_.isEqual),
            map<any, InParams>(({isComplete, isCurrentList}) => {
                return {
                    isComplete: isComplete || null,
                    isCurrentList: isCurrentList || null
                };
            })
        );
    }

    ngOnInit() {
        this.context$ = this.inParams$.pipe(
            mergeMap((params: InParams) =>
                // Get all lists from API
                this.getListsService.request(null, params).pipe(
                    pickResponseBody<ToDosList[]>(200),
                    map<ToDosList[], CompleteContext>(todosLists => ({
                        lists: todosLists,
                        ...params
                    })),
                )
            ),
            tap(context => console.log('Context', context)),
            share()
        ) as any;
    }

    // ***

    openCreateGroupPopup() {
        this.matBottomSheet.open(EditGroupComponent);
    }
}
