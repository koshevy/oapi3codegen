import { merge, of, Observable, Subject } from 'rxjs';
import {
    bufferTime,
    auditTime,
    catchError,
    distinctUntilChanged,
    filter,
    finalize,
    map,
    scan,
    share,
    shareReplay,
    takeUntil
} from 'rxjs/operators';
import {
    Component,
    ChangeDetectorRef,
    ChangeDetectionStrategy,
    ElementRef,
    EventEmitter,
    OnDestroy,
    OnInit,
    NgZone,
    ViewChild,
    ViewChildren
} from '@angular/core';

import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
    ActionType,
    ComponentContext,
    ComponentTruth,
    Partial,
    ToDoTaskTeaser
} from './lib/context';

import { TodoTasksStore } from './todo-tasks.store';

import * as _ from 'lodash';
// It's just why plugin can be skipped by tree-shaker
import * as frolaListPlugin from 'froala-editor/js/plugins/lists.min';

import {
    createNewToDoTaskBlank,
    getFullTextOfSelectedTask,
    parseFullTextTask
} from './lib/helpers';

import {
    ToDoGroup,
    ToDoTask,
    GetGroupsResponse,
    GetGroupItemsResponse
} from '../api/typings';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import {
    PositionMoveByStep
} from './lib/context';

// TaskListComponent types
import {
    TaskListComponent,
    TaskListEventType,
    TaskListEventData
} from './task-list';

// ***

const autoSavePeriod = 2000;

// ***

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        TodoTasksStore
    ],
    selector: 'lib-todo-tasks',
    styleUrls: ['./todo-tasks.component.scss'],
    templateUrl: './todo-tasks.component.html'
})
export class TodoTasksComponent implements OnDestroy, OnInit {

    // *** Configs

    frolaOptions = {
        attribution: false,
        events: {
            // Proxy non-catching events from Froala
            keydown: ({originalEvent}) => {
                this.onEditorKeydownFroala(originalEvent);
            }
        },
        immediateAngularModelUpdate: true,
        inlineStyles: {
            'Big Red': 'font-size: 20px; color: red;',
            'Small Blue': 'font-size: 14px; color: blue;'
        },
        placeholderText: 'Enter task title',
        pluginsEnabled: [
            'inlineStyle',
            'lists'
        ],
        toolbarButtons: [
            'bold',
            'italic',
            'underline',
            'strikeThrough',
            'fontSize',
            'inlineStyle',
            'formatOLSimple',
            'formatUL',
            'clearFormatting',
        ],
    };

    frolaPlugins = [
        frolaListPlugin
    ];

    // *** View children

    @ViewChild('taskEditor', {
        read: false,
        static: false
    }) takEditorElement: ElementRef;

    @ViewChild(TaskListComponent, {
        read: false,
        static: false
    }) taskListComponent: TaskListComponent;

    // *** Component state

    /**
     * Flow that collect all changes of values that could influence
     * to component state. Once one of that changes, this flow prepare
     * it in a common "Truth", and emits this complete "Truth".
     */
    truth$: Observable<ComponentTruth>;

    /**
     * Full context flow of component. Do changes of view
     * every emission.
     */
    context$: Observable<ComponentContext>;

    /**
     * Emitting to this channel completes {@link truth$} and {@link context$}.
     */
    destroy$: Subject<void>;

    /**
     * Part of "truth": channel with manual-triggered actions and theirs data
     */
    manualActions$: Subject<Partial<ComponentTruth>> = new Subject();

    // *** Form data

    taskEditorControl: FormControl = new FormControl('');

    /**
     * Synchronized task list of tasks.
     */
    syncedTaskList: ToDoTaskTeaser[];

    // *** Public events

    constructor(
        private store: TodoTasksStore,
        private cdr: ChangeDetectorRef,
        private matSnackBar: MatSnackBar,
        private ngZone: NgZone
    ) { }

    ngOnInit(): void {
        this.destroy$ = new Subject<void>();

        // Merge sources of truth
        this.truth$ = this.ngZone.runOutsideAngular(() =>
            merge(
                // Init action
                of({
                    $$lastAction: ActionType.InitializeWithDefaultState
                }),
                // From route
                this.getTruthFromRouteParams(),
                // Actions, dispatched manually
                this.manualActions$
            ).pipe(
                // And transform to complete truth
                scan<Partial<ComponentTruth>, ComponentTruth>(
                    (acc, cur) => ({ ...acc, ...cur })
                ),
                share(),
                takeUntil(this.destroy$)
            )
        );

        // Make context flow
        this.context$ = this.ngZone.runOutsideAngular(() =>
            this.store.getNewContextFlow(this.truth$).pipe(
                catchError(error => of(null)),
                // For cases when gets default state before subscribes
                shareReplay(1)
            )
        );

        // Handle action changes in component mechanics
        this.context$.subscribe(this.applyContext.bind(this));

        // Handle editor changes
        this.ngZone.runOutsideAngular(() =>
            this.taskEditorControl.valueChanges.pipe(
                distinctUntilChanged(),
            )
        ).subscribe(
            this.handleEditorChanges.bind(this)
        );

        // Turn on listener triggering on
        // optimistic actions changing tasks
        this.initAutoSaveListener();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
    }

    getTruthFromRouteParams(): Observable<ComponentTruth> {
        return of({
            $$lastAction: ActionType.InitializeWithRouteParams,
            selectedGroups: []
        }) as Observable<ComponentTruth>;
    }

    applyContext(context: ComponentContext): void {
        if (!context) {
            this.matSnackBar.open('Error had occur in action!', 'Reload', {
                panelClass: ['alert', 'alert-danger']
            }).onAction().subscribe(() => {
                // Repeats attempt
                location.reload();
            });

            return;
        }

        switch (context.$$lastAction) {
            case ActionType.AddNewTaskOptimistic:
                this.updateTaskEditor(context);
                this.syncedTaskList = context.tasks
                    ? [...context.tasks]
                    : null;

                this.manualActions$.next({
                    $$lastAction: ActionType.SelectTask,
                    lastSelectedTaskUid: context.lastAddedTask.uid
                });

                break;

            case ActionType.EditTaskOptimistic:
                // it's mean only title wa changed (from list)
                if (context.lastEditingData.description === undefined) {
                    this.updateTaskEditor(context);
                } else {
                    this.syncedTaskList = context.tasks
                        ? [...context.tasks]
                        : null;
                }

                break;

            // Return focus to selected task after moving
            case ActionType.AddNewEmptyTaskAfterOptimistic:
            case ActionType.ChangeTaskPositionOptimistic:
            case ActionType.DeleteTaskOptimistic:
            // case ActionType.MarkTaskAsUnDoneOptimistic:
            // case ActionType.MarkTaskAsDoneOptimistic:
                setTimeout(() => this.setFocusToActiveTask(), 0);

            // for this case nothing to apply in component
            case ActionType.SaveChangedItems:

                this.matSnackBar.open('Changes saved', null, {
                    duration: 1000,
                    panelClass: ['alert', 'alert-success']
                });

                break;

            default:
                this.updateTaskEditor(context);
                this.syncedTaskList = context.tasks
                    ? [...context.tasks]
                    : null;
        }

        // Update view related with this.syncedTaskList
        this.cdr.detectChanges();
    }

    initAutoSaveListener(): void {
        this.truth$.pipe(
            map<ComponentTruth, number | null>(thuth => {
                switch (thuth.$$lastAction) {
                    case ActionType.AddNewEmptyTaskAfterOptimistic:
                    case ActionType.AddNewTaskOptimistic:
                        return thuth.lastAddedTask.uid;

                    case ActionType.EditTaskOptimistic:
                        return thuth.lastEditingData.uid;

                    case ActionType.MarkTaskAsUnDoneOptimistic:
                    case ActionType.MarkTaskAsDoneOptimistic:
                        return thuth.lastToggledTaskUid;

                    // ActionType.ChangeTaskPositionOptimistic,

                    default:
                        return null;
                }
            }),
            filter(uid => !!uid),
            bufferTime(autoSavePeriod),
            filter(bufferedUids => !!bufferedUids.length)
        ).subscribe(bufferedUids => {
            // uid of tasks have to be saved
            const uniqUids = _.uniq(bufferedUids);

            this.manualActions$.next({
                $$lastAction: ActionType.SaveChangedItems,
                lastBufferedToSave: uniqUids
            });
        });
    }

    // *** Events

    onEditorKeydown(event: KeyboardEvent): void | boolean {
        switch (event.key) {
            case 'Tab':
                if (event.shiftKey) {
                    this.setFocusToActiveTask();

                    return false;
                }
        }
    }

    /**
     * Catch Froala events, non-catching from template binding.
     *
     * @param {KeyboardEvent} event
     * @return {void | boolean}
     */
    onEditorKeydownFroala(event: KeyboardEvent): void | boolean {
        switch (event.key) {
            case 'Escape':
                this.setFocusToActiveTask();

                return false;
        }
    }

    onTaskListEvent(event: TaskListEventData): void {
        switch (event.type) {
            case TaskListEventType.FocusDelegated:
                this.setFocusToEditor();
                break;
            case TaskListEventType.TaskAdded:
                this.addNewTask(event);
                break;
            case TaskListEventType.TaskAddedAfterSelected:
                this.addNewEmptyTaskAfterSelected();
                break;
            case TaskListEventType.TaskChanged:
                this.manualActions$.next({
                    $$lastAction: ActionType.EditTaskOptimistic,
                    lastEditingData: {
                        title: event.title,
                        uid: event.uid
                    }
                });
                break;
            case TaskListEventType.TaskMoved:
                this.moveTask(event);
                break;
            case TaskListEventType.TaskMovedUp:
            case TaskListEventType.TaskMovedDown:
                this.moveTaskUpDown(event);
                break;
            case TaskListEventType.TaskDeleted:
                this.manualActions$.next({
                    $$lastAction: ActionType.DeleteTaskOptimistic,
                    lastDeletedTaskUid: event.uid
                });
                break;
            case TaskListEventType.TaskGotFocus:
                this.manualActions$.next({
                    $$lastAction: ActionType.SelectTask,
                    lastSelectedTaskUid: event.uid
                });
                break;
            case TaskListEventType.TaskToggled:
                this.toggleTaskIsDone(event);
                break;
        }
    }

    // *** Private methods

    private moveTask({from, to}: TaskListEventData<TaskListEventType.TaskMoved>) {
        this.manualActions$.next({
            $$lastAction: ActionType.ChangeTaskPositionOptimistic,
            lastTaskPositionChanging: { from, to }
        });
    }

    private moveTaskUpDown(event: TaskListEventData<
        | TaskListEventType.TaskMovedUp
        | TaskListEventType.TaskMovedDown
    >) {
        const direction = (event.type === TaskListEventType.TaskMovedUp)
            ? PositionMoveByStep.Up
            : PositionMoveByStep.Down;

        // Move item position
        this.manualActions$.next({
            $$lastAction: ActionType.ChangeTaskPositionOptimistic,
            lastTaskPositionChanging: direction
        });
    }

    private toggleTaskIsDone(event: TaskListEventData<TaskListEventType.TaskToggled>): void {
        const actionType = event.isDone
            ? ActionType.MarkTaskAsDoneOptimistic
            : ActionType.MarkTaskAsUnDoneOptimistic;

        this.manualActions$.next({
            $$lastAction: actionType,
            lastToggledTaskUid: event.uid
        });
    }

    private addNewTask({title}: TaskListEventData<TaskListEventType.TaskAdded>): void {
        const lastAddedTask: ToDoTaskTeaser = {
            ...createNewToDoTaskBlank(title),
            failed: false,
            optimistic: true,
            pending: false
        };

        this.manualActions$.next({
            $$lastAction: ActionType.AddNewTaskOptimistic,
            lastAddedTask
        });
    }

    private addNewEmptyTaskAfterSelected(): void {
        const lastAddedTask: ToDoTaskTeaser = {
            ...createNewToDoTaskBlank(''),
            failed: false,
            optimistic: true,
            pending: false
        };

        this.manualActions$.next({
            $$lastAction: ActionType.AddNewEmptyTaskAfterOptimistic,
            lastAddedTask
        });
    }

    private handleEditorChanges(fullText): void {
        this.manualActions$.next({
            $$lastAction: ActionType.EditTaskOptimistic,
            lastEditingData: {
                ...parseFullTextTask(fullText),
                uid: null
            }
        });
    }

    private updateTaskEditor(context: ComponentContext): void {
        const selectedTaskFullText = getFullTextOfSelectedTask(
            context.tasks,
            context.selectedTaskUid
        );

        // Change view, but not to emit to subscriber
        this.taskEditorControl.setValue(selectedTaskFullText, {
            emitEvent: false,
            emitViewToModelChange: true
        });
    }

    private setFocusToEditor() {
        if (this.takEditorElement) {
            const { nativeElement } = this.takEditorElement;
            const focusedArea = (nativeElement as HTMLElement)
                .querySelector<HTMLElement>('[contentEditable]');

            if (focusedArea) {
                focusedArea.focus();
            }
        }
    }

    private setFocusToActiveTask() {
        if (this.taskListComponent) {
            this.taskListComponent.setFocusToActiveTask();
        }
    }
}
