import type { QueryInterface } from 'sequelize';
export interface MigrationContext {
    queryInterface: QueryInterface;
    schema: string;
}
export declare function migrateUp(): Promise<void>;
export declare function migrateDown(): Promise<void>;
