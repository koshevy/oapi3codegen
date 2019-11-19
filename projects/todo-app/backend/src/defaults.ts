import { getNowISO } from './helpers';
import * as generateUid from 'nanoid';

import { ToDoGroup, ToDoTask } from './schema/typings';

const nowISO = getNowISO();
let lastGeneratedGroupUid: string;

export const defaultGroups: ToDoGroup[] = [
    {
        uid: lastGeneratedGroupUid = generateUid(),
        dateChanged: nowISO,
        dateCreated: nowISO,
        items: [
            {
                uid: generateUid(),
                title: 'Make cleaning',
                description: 'I had planned to make cleaning every week',
                dateCreated: nowISO,
                dateChanged: nowISO,
                groupUid: lastGeneratedGroupUid,
                isDone: false,
                position: 0,
            },
            {
                uid: generateUid(),
                title: 'Walk the dog',
                description: 'Well, in this park it\'s illegal not to have your animal leashed or without a collar.',
                dateCreated: nowISO,
                dateChanged: nowISO,
                groupUid: lastGeneratedGroupUid,
                isDone: false,
                position: 1,
            },
            {
                uid: generateUid(),
                title: 'Buy meat fo BBQ',
                description: 'Next week we gonna make BBQ party. I hope it\'s wont be vegan BBQ party!',
                dateCreated: nowISO,
                dateChanged: nowISO,
                groupUid: lastGeneratedGroupUid,
                isDone: false,
                position: 2,
            },
        ] as ToDoTask[],
        isComplete: false,
        title: 'Domestic affairs',
    },
    {
        uid: lastGeneratedGroupUid = generateUid(),
        description: [
            'For example, a staff member in a regional office reported being',
            'told by headquarters managers to pursue work priorities different',
            'from those previously agreed upon.',
        ].join(' '),
        dateChanged: nowISO,
        dateCreated: nowISO,
        items: [
            {
                uid: generateUid(),
                title: 'Prepare presentation',
                description: [
                    'I mean, technically, I have to put together a presentation,',
                    'they have to approve it, but they\'re really eager for me to get started.',
                ].join(' '),
                dateCreated: nowISO,
                dateChanged: nowISO,
                groupUid: lastGeneratedGroupUid,
                isDone: false,
                position: 0,
            },
            {
                uid: generateUid(),
                title: 'Write a report',
                description: [
                    'This promotes a sense of participation, but as a friend,',
                    'seasoned in such matters, informed me, the key in the end',
                    'is to ignore all the comments received and to write up the',
                    'report as if there were no Web site and no participation.',
                ].join(' '),
                dateCreated: nowISO,
                dateChanged: nowISO,
                groupUid: lastGeneratedGroupUid,
                isDone: false,
                position: 1,
            },
        ] as ToDoTask[],
        isComplete: false,
        title: 'Work priorities',
    },
    {
        uid: lastGeneratedGroupUid = generateUid(),
        description: [
            'A hobby is a regular activity done for enjoyment, typically during',
            'one\'s leisure time, not professionally and not for pay.',
        ].join(' '),
        dateChanged: nowISO,
        dateCreated: nowISO,
        items: [
            {
                uid: generateUid(),
                title: 'Book soccer field',
                description: [
                    'And soccer practice had been moved to the upper field.',
                    'Because this is the last practice before the championship.',
                ].join(' '),
                dateCreated: nowISO,
                dateChanged: nowISO,
                groupUid: lastGeneratedGroupUid,
                isDone: false,
                position: 0,
            },
            {
                uid: generateUid(),
                title: 'Visit gallery',
                description: [
                    'No matter if you are a visitor, a painter or a sculptor -',
                    'it will be equally fascinating for you to visit the exhibition!',
                ].join(' '),
                dateCreated: nowISO,
                dateChanged: nowISO,
                groupUid: lastGeneratedGroupUid,
                isDone: false,
                position: 1,
            },
        ] as ToDoTask[],
        isComplete: false,
        title: 'Hobbies',
    },
];
