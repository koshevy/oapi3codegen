import * as _ from 'lodash';
import { GlobalPartial } from 'lodash/common/common';
import {
    combineLatest,
    merge,
    of,
    Observable,
    Subject,
    Subscription
} from 'rxjs';
import {
    debounceTime,
    distinctUntilChanged,
    map,
    scan,
    share,
    shareReplay,
    publishReplay,
    startWith
} from 'rxjs/operators';

import {
    ChangeDetectionStrategy,
    Component,
    Inject,
    OnDestroy,
    OnInit,
    Optional
} from '@angular/core';
import { FormControl, FormGroup, Validators, ValidatorFn } from '@angular/forms';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

import { ToDosListBlank, ToDosItemBlank } from '../../api/typings';
import { schema } from '../../api/services';
import { JsonValidationService } from '../../lib/json-validation.service';
import {
    clearPersistentData,
    loadPersistentData,
    savePersistentData,
    textFromTodosItems,
    todosItemsFromText
} from '../../lib/helpers';

// ***

type Partial<T> = GlobalPartial<T>;

const enum ActionTypes {
    Initialization = '[Initialization]',
    ValidationStatusChange = '[Validation status change]',
    UserChangeForm = '[User Change Form]',
    UserSaveForm = '[User Save Form]'
}

const enum FormType {
    Create = 'create',
    Save = 'save'
}

interface ComponentTruth {
    formType: FormType;

    /**
     * Raw form data as a source
     */
    formState: {
        description: string;
        title: string;
        tasksText: string;
    };

    /**
     * Group that uses as initial value and
     * should be changed after save. If set this form
     * is for save, not for create
     */
    initialToDosListBlank?: ToDosListBlank;
    isFormDataValid: boolean;
    lastAction: ActionTypes;
}

interface ComponentContext extends ComponentTruth {

    /**
     * Complete {@link ToDosListBlank} data based on
     * {@link ComponentContext.formState}
     */
    completeToDosListBlank?: ToDosListBlank | null;

    savingEnabled: boolean;
}

/**
 * External custom config can be passed from parent component.
 */
export interface EditGroupConfig {
    customValidators: {
        [field: string]: ValidatorFn[]
    };

    /**
     * Group that uses as initial value and
     * should be changed after save. If set this form
     * is for save, not for create
     */
    initialToDosListBlank?: ToDosListBlank;
}

// ***

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'lib-edit-group',
    styleUrls: ['./edit-group.component.scss'],
    templateUrl: './edit-group.component.html'
})
export class EditGroupComponent implements OnInit, OnDestroy {

    public defaultFormData = {
        description: null,
        tasksText: [
            '[x] Subscribe on fitness',
            'Go to swimming pool'
        ].join('\n'),
        title: null
    };

    /**
     * Messages to be merged with `#/components.schemas.ToDosListBlank`
     * in a {@link schema} in {@link getFormJsonSchemaWithMessages}.
     *
     * Format of this messages supported in {@link https://www.npmjs.com/package/ajv}
     */
    public errorMessages = {
        description: {
            errorMessage: {
                maxLenth: 'Description should be understandable, but not redundant',
                minLength: 'Please, set description in one/two sequences',
                type: 'Description of task group helps you to remember intention of task group'
            }
        },
        title: {
            errorMessage: {
                maxLenth: 'Title should\'t be long',
                minLength: 'Name should\'t be so short',
                type: 'Name of task group is required'
            }
        }
    };

    /**
     * "Truth" of component: prepared data flow has to be
     * a source for context.
     * @see context$
     */
    public truth$: Observable<ComponentTruth>;

    /**
     * Manual actions (such as "Save") have to be kind
     * of source for the {@see truth$}.
     */
    public actions$: Subject<Partial<ComponentTruth>> = new Subject();

    /**
     * Flow of complete context (state) of component.
     * Context is based on "truth" with additional
     * calculations and interpretations.
     */
    public context$: Observable<ComponentContext>;

    public formGroup: FormGroup;
    protected subscriptions: Subscription[] = [];

    constructor(
        protected matBottomSheetRef: MatBottomSheetRef,
        @Optional() @Inject(MAT_BOTTOM_SHEET_DATA)
            protected customOptions: EditGroupConfig = {customValidators: {}}
    ) {
        const validatorFactory = new JsonValidationService();
        const createValidator = validatorFactory.createValidator.bind(
            validatorFactory
        );

        /**
         * Loaded form data. Has to be saved here — {@link listenEffects}.
         */
        let initFormData;

        if (customOptions.initialToDosListBlank) {
            const group = customOptions.initialToDosListBlank;

            initFormData = {
                ..._.pick(group, ['title', 'description']),
                tasksText: textFromTodosItems(
                    group.items
                )
            };
        } else {
            initFormData = loadPersistentData(this, 'formState')
                || this.defaultFormData;
        }

        const { customValidators } = customOptions;

        validatorFactory.setScheme(
            this.getFormJsonSchemaWithMessages()
        );

        this.formGroup = new FormGroup({
            description: new FormControl(
                initFormData.description,
                Validators.compose([
                    createValidator('description'),
                    ...(customValidators['description'] || [])
                ])
            ),
            tasksText: new FormControl(
                initFormData.tasksText,
                [
                    ...(customValidators['tasksText'] || [])
                ]
            ),
            title: new FormControl(
                initFormData.title,
                [
                    createValidator('title'),
                    ...(customValidators['title'] || [])
                ]
            )
        });
    }

    ngOnInit() {
        this.initTruthFlow();
        this.initContextFlow();
        this.listenEffects();
    }

    ngOnDestroy() {
        _.each(this.subscriptions, subscription => {
            if (!subscription.closed) {
                subscription.unsubscribe();
            }
        });
    }

    initTruthFlow(): void {
        /**
         * Local source of truth — is a two parts of it:
         * formState and validity status.
         */
        type ComponentContextTruthSrc = [
            Partial<ComponentTruth>,
            Partial<ComponentTruth>
        ];

        // Listening sources of thruth
        this.truth$ = merge(
            // Init data
            of({
                formState: this.formGroup.value,
                formType: !!this.customOptions.initialToDosListBlank
                    ? FormType.Save
                    : FormType.Create,
                initialToDosListBlank: this.customOptions.initialToDosListBlank,
                isFormDataValid: this.formGroup.status === 'VALID',
                lastAction: ActionTypes.Initialization,

            }),
            // User input
            this.formGroup.valueChanges.pipe(
                map(formState => ({
                    formState,
                    lastAction: ActionTypes.UserChangeForm
                }))
            ),
            // Form Validation
            this.formGroup.statusChanges.pipe(
                distinctUntilChanged(),
                map((status: 'VALID' | any) =>
                    ({
                        isFormDataValid: status === 'VALID',
                        lastAction: ActionTypes.ValidationStatusChange
                    })
                )
            ),
            // Manual user actions
            this.actions$
        ).pipe(
            // And transform to complete truth
            scan<Partial<ComponentTruth>, ComponentTruth>((acc, cur) =>
                ({...acc, ...cur})
            )
        );
    }

    initContextFlow(): void {
        this.context$ = this.truth$.pipe(
            map((truth: ComponentTruth) => {
                let completeToDosListBlank: ToDosListBlank | null;
                let savingEnabled: boolean;

                if (truth.isFormDataValid) {
                    const { tasksText } = truth.formState;

                    completeToDosListBlank = {
                        ...truth.initialToDosListBlank || {},
                        description: truth.formState.description,
                        items: todosItemsFromText(tasksText),
                        title: truth.formState.title
                    };

                    savingEnabled = true;
                } else {
                    completeToDosListBlank = null;
                    savingEnabled = false;
                }

                return {
                    ...truth,
                    completeToDosListBlank,
                    savingEnabled
                };
            }),
            shareReplay(1)
        );
    }

    /**
     * Effects of context changing: interaction of component with
     * environment.
     */
    listenEffects() {
        let autoSaveSubscr, saveFormSubscr;

        // Autosave drafts
        autoSaveSubscr = this.context$.pipe(debounceTime(1500)).subscribe(
            (context: ComponentContext) => {
                if (context.isFormDataValid && (context.formType === FormType.Create)) {
                    savePersistentData(
                        this,
                        'formState',
                        context.formState
                    );
                }
            }
        );

        // Interactions
        saveFormSubscr = this.context$.subscribe((context: ComponentContext) => {
            switch (context.lastAction) {
                // Close and return result
                case ActionTypes.UserSaveForm:
                    if (context.savingEnabled) {
                        // clearPersistentData(this, 'formState');
                        this.matBottomSheetRef.dismiss(
                            context.completeToDosListBlank
                        );
                    }

                    saveFormSubscr.unsubscribe();
                    // no more autosaves needed
                    autoSaveSubscr.unsubscribe();

                    break ;
            }
        });

        this.subscriptions.push(autoSaveSubscr, saveFormSubscr);
    }

    /**
     * Make complete schema for validation data of {@link formGroup}.
     *
     * Gets needed sub-schema from {@link schema} (`#/components.schemas.ToDosListBlank`),
     * and merge with {@link errorMessages}.
     */
    getFormJsonSchemaWithMessages(): object {
        const schemaWithoutMessages = {
            ...schema.components.schemas.ToDosListBlank,
            components: schema.components,
        };

        return _.merge(schemaWithoutMessages, {
            properties: {
                ...this.errorMessages
            }
        });
    }

    // ***

    onSave() {
        this.actions$.next({
            lastAction: ActionTypes.UserSaveForm
        });
    }

    onCancel() {
        this.matBottomSheetRef.dismiss(null);
    }

    // *** Private methods

    private getInitFormData(): {[key: string]: any} {
        if (this.customOptions.initialToDosListBlank) {
            const group = this.customOptions.initialToDosListBlank;

            return {
                ..._.pick(group, ['title', 'description']),
                tasksText: textFromTodosItems(group.items)
            };
        } else {
            return loadPersistentData(this, 'formState')
                || this.defaultFormData;
        }
    }
}
