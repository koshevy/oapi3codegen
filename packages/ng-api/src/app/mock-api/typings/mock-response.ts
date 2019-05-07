export interface Hero {
    universe: 'Marvel' | 'DC';
    name: string;
    films: string[];
    superpower: string | null;
}

export interface MockResponse {
    [index: number]: Hero;
}
