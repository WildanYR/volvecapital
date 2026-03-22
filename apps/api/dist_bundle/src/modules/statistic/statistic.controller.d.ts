import { AppRequest } from 'src/types/app-request.type';
import { StatisticService } from './statistic.service';
export declare class StatisticController {
    private readonly statisticService;
    constructor(statisticService: StatisticService);
    getAllStatistic(request: AppRequest): Promise<{
        revenue: {
            today: import("../../database/models/revenue-statistics.model").RevenueStatistics | undefined;
            month: import("../../database/models/revenue-statistics.model").RevenueStatistics | undefined;
            daily: import("../../database/models/revenue-statistics.model").RevenueStatistics[];
        };
        product: {
            date: string;
            type: string;
            product_variant_id: string;
            items_sold: number;
            product_variant: {
                id: string;
                name: string;
                product: {
                    id: string;
                    name: string;
                };
            };
            created_at: Date;
            updated_at: Date;
        }[];
        platform: import("../../database/models/platform-statistics.model").PlatformStatistics[];
        peakHour: import("../../database/models/peak-hour-statistics.model").PeakHourStatistics[];
    }>;
}
