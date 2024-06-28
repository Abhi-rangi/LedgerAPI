export interface Patient {
    resourceType: string;
    id: string;
    identifier: Array<{
        use: string;
        type: {
            coding: Array<{
                system: string;
                code: string;
                display: string;
            }>;
            text: string;
        };
        system: string;
        value: string;
        period: {
            start: string;
        };
        assigner: {
            display: string;
        };
    }>;
    active: boolean;
    name: Array<{
        use: string;
        family: string;
        given: string[];
    }>;
    gender: string;
    birthDate: string;
    address: Array<{
        use: string;
        line: string[];
        city: string;
        state: string;
        postalCode: string;
        country: string;
    }>;
}
