import * as _ from 'lodash';
import { GlobalPartial as Partial } from 'lodash/common/common';

import {
    assertUniqueTitle,
    createGroupFromBlank,
    createTaskFromBlank
} from './helpers';

import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from '@nestjs/common';

import {
    GetGroupItemsParameters,
    GetGroupsParameters,
    GetGroupsResponse,
    ToDoGroup,
    ToDoGroupBlank,
    ToDoTask,
    ToDoTaskBlank
} from './schema/typings';

import { defaultGroups } from './defaults';

/**
 * Mock service imitates storage for {@link ToDoGroup} and {@link ToDoTask},
 * as if it was a facade of DB-storage. Keeps temporary session data in memory
 * without authentification.
 */
@Injectable()
export class TodoStorageService {
    public session;

    constructor() {
        // ...
    }

    /**
     * Set session injected to controller action.
     * Session should be set before first using of service:
     *
     * @example
     * ```
     * return this.appService
     *     .setSession(session)
     *     .patchGroup(params.groupId, body);
     * ```
     *
     * @param session
     * @return
     */
    setSession(session): TodoStorageService {
        this.session = session;
        return this;
    }

    /**
     * @param filters
     * @return Array of found groups
     */
    getGroups(filters: GetGroupsParameters = {}): ToDoGroup[] {
        let result = defaultGroups;

        if (this.session) {
            if (this.session.groups) {
                result = this.session.groups;
            } else {
                this.session.groups = result;
            }
        }

        return _(result)
            .filter((group: ToDoGroup) =>
                filters.isComplete ? group.isComplete : true
            )
            .map((group: ToDoGroup) =>
                filters.withItems === false ? { ...group, items: [] } : group
            )
            .value();
    }

    /**
     * @param
     * @return
     * @throws NotFoundException
     * @return Found group
     */
    getGroupByUid(groupUid: string): ToDoGroup {
        const groups = this.getGroups();
        const foundGroup = _.find(
            groups,
            (group: ToDoGroup) => group.uid === groupUid
        );

        if (!foundGroup) {
            throw new NotFoundException(`Group with uid=${groupUid} not found`);
        }

        return foundGroup;
    }

    /**
     * @param groupBlank
     * @return
     * @throws InternalServerErrorException
     * @return Created group with assigned UID and meta-data
     */
    createGroup(groupBlank: ToDoGroupBlank): ToDoGroup {
        groupBlank.title = (groupBlank.title || '').trim();

        const groups = this.getGroups();

        assertUniqueTitle(groups, groupBlank.title);

        const newGroup = createGroupFromBlank(groupBlank);
        this.session.groups = [...groups, newGroup];

        return newGroup;
    }

    /**
     * @param groupUid
     * @param groupBlank
     * @return Updated group data
     */
    rewriteGroup(groupUid: string, groupBlank: ToDoGroupBlank): ToDoGroup {
        const alreadyExistsGroup = this.getGroupByUid(groupUid);

        assertUniqueTitle(this.getGroups(), groupBlank.title, groupUid);

        /**
         * Omitted options of `ToDoGroupBlank`:
         * if `items` not set in blank, ignoring in result group too.
         */
        const omitOptions = groupBlank.items
            ? ['uid']
            : ['uid', 'items'];

        const group: ToDoGroup = createGroupFromBlank(groupBlank);
        const patch: Partial<ToDoGroup> = _.omit(group, omitOptions);

        _.assign(alreadyExistsGroup, patch);

        return alreadyExistsGroup;
    }

    /**
     * @param groupUid
     * @param patch
     * @return Updated group data
     */
    patchGroup(groupUid: string, patch: Partial<ToDoGroupBlank>): ToDoGroup {
        const alreadyExistsGroup = this.getGroupByUid(groupUid);

        if (patch.title) {
            assertUniqueTitle(this.getGroups(), patch.title, groupUid);
        }

        _.assign(alreadyExistsGroup, _.omit(patch, ['uid', 'items']));

        return alreadyExistsGroup;
    }

    /**
     * @param groupUid
     */
    deleteGroup(groupUid: string): void {
        const foundIndex = _.findIndex(
            this.getGroups(),
            (group: ToDoGroup) => group.uid === groupUid
        );

        if (foundIndex === -1) {
            throw new NotFoundException(`Group with uid=${groupUid} not found`);
        }

        const groups = this.getGroups();
        groups.splice(foundIndex, 1);
        this.session.groups = groups;
    }

    /**
     * todo support filters (isComplete)
     *
     * @param groupId
     * @return
     * Filtered tasks of group
     */
    getTasksOfGroup(groupId: string): ToDoTask[] {
        return this.getGroupByUid(groupId).items;
    }

    /**
     * @param groupUid
     * @param taskBlank
     * @return Created task with assigned uid and meta-data
     */
    createTaskOfGroup(groupUid: string, taskBlank: ToDoTaskBlank): ToDoTask {
        const group = this.getGroupByUid(groupUid);
        const newTask = createTaskFromBlank(
            taskBlank,
            group.items.length,
            groupUid
        );

        group.items = [...group.items as ToDoTask[], newTask];

        return newTask;
    }
}
