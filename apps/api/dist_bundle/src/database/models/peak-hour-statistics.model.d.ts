import { Optional } from 'sequelize';
import { Model } from 'sequelize-typescript';
export interface PeakHourStatisticsAttributes {
    date: string;
    type: string;
    hour: number;
    transaction_count: number;
    created_at: Date;
    updated_at: Date;
}
interface PeakHourStatisticsCreationAttributes extends Optional<PeakHourStatisticsAttributes, 'created_at' | 'updated_at'> {
}
export declare class PeakHourStatistics extends Model<PeakHourStatisticsAttributes, PeakHourStatisticsCreationAttributes> {
    date: string;
    type: string;
    hour: number;
    transaction_count: number;
}
export {};
