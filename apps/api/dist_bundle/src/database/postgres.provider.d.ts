import { ConfigService } from '@nestjs/config';
import { QueryOptions, Transaction } from 'sequelize';
export declare class PostgresProvider {
    private configService;
    private sequelize?;
    constructor(configService: ConfigService);
    transaction(): Promise<Transaction>;
    rawQuery(sql: string, options: QueryOptions): Promise<[unknown[], unknown]>;
    setSchema(schema: string, transaction: Transaction): Promise<void>;
}
