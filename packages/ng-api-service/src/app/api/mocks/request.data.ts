export interface MockRequestData {
    params: any;
    request: any;
    response: any;
}

export const FindPetsService: MockRequestData = {
    params: {
        tags: ['cat', 'dog'],
        limit: []
    },
    request: null,
    response: [
        {
            id: 1,
            name: 'Barsique',
            tag: 'cat'

        },
        {
            id: 2,
            name: 'Scharique',
            tag: 'dog'
        }
    ]
};
