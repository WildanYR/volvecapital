export declare function DatabaseConfig(): {
    database: {
        url: string;
        pool: {
            min: number;
            max: number;
            acquire: number;
            idle: number;
            evict: number;
        };
    };
};
