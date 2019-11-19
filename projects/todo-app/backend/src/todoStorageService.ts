import * as _ from 'lodash';
import { GlobalPartial as Partial } from 'lodash/common/common';

import {
    assertUniqueTitle,
    createGroupFromBlank
} from './helpers';

import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';

import {
    GetGroupItemsParameters,
    GetGroupsParameters,
    GetGroupsResponse,
    ToDoGroup,
    ToDoGroupBlank,
    ToDoTask,
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

    setSession(session): TodoStorageService {
        this.session = session;
        return this;
    }

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
                filters.isComplete ? group.isComplete : true,
            )
            .map((group: ToDoGroup) =>
                (filters.withItems === false) ? {...group, items: []} : group,
            )
            .value();
    }

    /**
     * @param
     * @return
     * @throws NotFoundException
     */
    getGroup(groupUid: string): ToDoGroup {
        const groups = this.getGroups();
        const alreadyExists = this.getGroupById(groupUid);

        return alreadyExists;
    }

    /**
     * @param groupBlank
     * @return
     * @throws InternalServerErrorException
     */
    createGroup(groupBlank: ToDoGroupBlank): ToDoGroup {
        groupBlank.title = (groupBlank.title || '').trim();

        const groups = this.getGroups();

        assertUniqueTitle(groups, groupBlank.title);

        const newGroup = createGroupFromBlank(groupBlank);
        this.session.groups = [...groups, newGroup];

        return newGroup;
    }

    rewriteGroup(groupUid: string, groupBlank: ToDoGroupBlank): ToDoGroup {
        const alreadyExistsGroup = this.getGroupById(groupUid);

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

    patchGroup(groupUid: string, patch: Partial<ToDoGroupBlank>): ToDoGroup {
        const alreadyExistsGroup = this.getGroupById(groupUid);

        if (patch.title) {
            assertUniqueTitle(this.getGroups(), patch.title, groupUid);
        }

        _.assign(alreadyExistsGroup, _.omit(patch, ['uid', 'items']));

        return alreadyExistsGroup;
    }

    // *** Private

    private getGroupById(groupUid: string): ToDoGroup {
        const groups = this.getGroups();
        const foundGroup = _.find(
            groups,
            (group: ToDoGroup) => group.uid === groupUid,
        );

        if (!foundGroup) {
            throw new NotFoundException(`Group with uid=${groupUid} not found`);
        }

        return foundGroup;
    }
}
