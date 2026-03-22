import { Optional } from 'sequelize';
import { Model } from 'sequelize-typescript';
export interface RevenueStatisticsAttributes {
    date: string;
    type: string;
    total_revenue: number;
    transaction_count: number;
    created_at: Date;
    updated_at: Date;
}
interface RevenueStatisticsCreationAttributes extends Optional<RevenueStatisticsAttributes, 'created_at' | 'updated_at'> {
}
export declare class RevenueStatistics extends Model<RevenueStatisticsAttributes, RevenueStatisticsCreationAttributes> {
    date: string;
    type: string;
    total_revenue: number;
    transaction_count: number;
}
export {};
