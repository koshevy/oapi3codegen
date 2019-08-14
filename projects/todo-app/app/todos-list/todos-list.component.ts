import * as _ from 'lodash';
import {
    merge,
    of,
    throwError,
    BehaviorSubject,
    MonoTypeOperatorFunction,
    Observable,
    Subject
} from 'rxjs';
import {
    catchError,
    distinctUntilChanged,
    delay,
    filter,
    map,
    mergeMap,
    mergeScan,
    onErrorResumeNext,
    publishReplay,
    share,
    shareReplay,
    scan,
    startWith,
    takeUntil,
    tap
} from 'rxjs/operators';

import {
  Component,
  OnInit,
  ChangeDetectionStrategy
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Overlay } from '@angular/cdk/overlay';

import { tapResponse, pickResponseBody } from '@codegena/ng-api-service';

import { ToDosList } from '../api/typings';
import { GetListsService, CreateListService } from '../api/services';
import { createUniqValidator } from '../lib/helpers';

import { EditGroupComponent, EditGroupConfig } from './edit-group/edit-group.component';
import {
    TodosListStore,
    Partial,
    ActionType,
    ToDosListTeaser,
    ComponentTruth,
    ComponentContext
} from './todos-list.store';

// ***

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TodosListStore],
    selector: 'lib-todos-list',
    styleUrls: ['./todos-list.component.scss'],
    templateUrl: './todos-list.component.html'
})
export class TodosListComponent implements OnInit {

    truth$: Observable<ComponentTruth>;
    context$: Observable<ComponentContext>;
    manualActions$: Subject<Partial<ComponentTruth>> = new Subject();
    syncContext: ComponentContext;

    private tempIdCounter = -1;

    constructor(
        protected activatedRoute: ActivatedRoute,
        protected store: TodosListStore,
        protected matBottomSheet: MatBottomSheet,
        protected matSnackBar: MatSnackBar,
        protected overlay: Overlay
    ) {
        /**
         * Merge sources of truth
         */
        this.truth$ = merge(
            // From route
            this.getTruthFromRouteParams(),
            // Actions, dispatched manually
            this.manualActions$
        ).pipe(
            // And transform to complete truth
            scan<Partial<ComponentTruth>, ComponentTruth>(
                (acc, cur) => ({ ...acc, ...cur })
            ),
            share()
        );
    }

    ngOnInit() {
        this.context$ = this.store.createContextFlow(this.truth$);

        this.listenEffects();
    }

    getTruthFromRouteParams(): Observable<ComponentTruth> {
        return this.activatedRoute.queryParams.pipe(
            distinctUntilChanged(_.isEqual),
            map<any, ComponentTruth>(({isComplete, isCurrentList}) => {
                return {
                    isComplete: isComplete || null,
                    isCurrentList: isCurrentList || null,
                    lastAction: ActionType.InitializeWithRouteParams
                };
            })
        );
    }

    listenEffects() {
        this.context$.subscribe(
            (context) => {
                // Syncing context
                this.syncContext = context;

                switch (context.lastAction) {
                    case ActionType.AddNewGroupOptimistic:
                        this.matSnackBar.open('List added to book', null, {
                            duration: 1500,
                            horizontalPosition: 'center',
                            panelClass: ['alert', 'alert-info']
                        });
                        break;

                    case ActionType.AddNewGroup:
                        const teaserOfCreatedGroup = _.find(
                            context.lists,
                            ({uid}) => uid === context.createdGroup.uid
                        );

                        if (!teaserOfCreatedGroup) {
                            throw new Error('Application logic error!');
                        }

                        if (teaserOfCreatedGroup.failed) {
                            this.matSnackBar.open('Creation failed!', 'Try again', {
                                duration: 3000,
                                horizontalPosition: 'center',
                                panelClass: ['alert', 'alert-danger']
                            }).onAction().subscribe(() => {
                                // Repeat sending to server
                                this.manualActions$.next({
                                    ..._.pick(context, ['createdGroup']),
                                    lastAction: ActionType.AddNewGroup
                                });
                            });
                        } else {
                            this.matSnackBar.open('Changing successful saved!', null, {
                                duration: 1500,
                                horizontalPosition: 'center',
                                panelClass: ['alert', 'alert-success']
                            });
                        }

                        break;
                }
            }
        );
    }

    // *** Events

    openCreateGroupPopup() {

        // Additional validator for Group Creation Form:
        // check for unique of list
        const popupConfig: EditGroupConfig = {
            customValidators: {
                title: [createUniqValidator(
                    this.syncContext.lists,
                    'title'
                )]
            }
        };

        // Open creation dialog
        const subscribtion =  this.matBottomSheet.open<
            EditGroupComponent,
            EditGroupConfig,
            ToDosList
        >(EditGroupComponent, {
            data: popupConfig,
            scrollStrategy: this.overlay.scrollStrategies.reposition()
        })
            // Waiting for result
            .afterDismissed()
            .pipe(
                filter(v => !!v),
                // takeUntil(),
                map<ToDosList, Partial<ComponentTruth>>((newList) => ({
                    createdGroup: _.assign(
                        newList,
                        // Adds temporary ID
                        { uid: this.getTempId() }
                    )
                }))
            ).subscribe((truth: Partial<ComponentTruth>) => {
                // Optimistic adding of item (before sending to server)
                this.manualActions$.next({
                    ...truth,
                    lastAction: ActionType.AddNewGroupOptimistic
                });
                // Sending to server
                this.manualActions$.next({
                    ...truth,
                    lastAction: ActionType.AddNewGroup
                });

                subscribtion.unsubscribe();
            });
    }

    listDropped(event: CdkDragDrop<ToDosListTeaser[]>): void {
        this.manualActions$.next({
            lastAction: ActionType.ChangeListPosition,
            positionChanging: {
                from: event.previousIndex,
                to: event.currentIndex
            }
        });
    }

    // *** Private methods

    /**
     * Returns new temporary ID for optimistic added items.
     */
    private getTempId(): number {
        return this.tempIdCounter--;
    }
}
