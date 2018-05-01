export interface OApiInfo {
    title: string;
    version: string;
    description: string;
    termsOfService: string;
    contact: {
        name: string;
        email: string;
        url: string;
    },
    license: {
        name: string;
        url: string;
    },
    externalDocs: {
        description: string;
        url: string;
    }
}
