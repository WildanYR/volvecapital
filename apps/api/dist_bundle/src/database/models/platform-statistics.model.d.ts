import { Optional } from 'sequelize';
import { Model } from 'sequelize-typescript';
export interface PlatformStatisticsAttributes {
    date: string;
    type: string;
    platform: string;
    transaction_count: number;
    created_at: Date;
    updated_at: Date;
}
interface PlatformStatisticsCreationAttributes extends Optional<PlatformStatisticsAttributes, 'created_at' | 'updated_at'> {
}
export declare class PlatformStatistics extends Model<PlatformStatisticsAttributes, PlatformStatisticsCreationAttributes> {
    date: string;
    type: string;
    platform: string;
    transaction_count: number;
}
export {};
