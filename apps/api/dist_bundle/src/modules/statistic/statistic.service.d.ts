import { PeakHourStatistics } from 'src/database/models/peak-hour-statistics.model';
import { PlatformStatistics } from 'src/database/models/platform-statistics.model';
import { ProductSalesStatistics } from 'src/database/models/product-sales-statistics.model';
import { ProductVariant } from 'src/database/models/product-variant.model';
import { RevenueStatistics } from 'src/database/models/revenue-statistics.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { DateConverterProvider } from '../utility/date-converter.provider';
export declare class StatisticService {
    private readonly dateConverterProvider;
    private readonly postgresProvider;
    private readonly revenueStatisticRepository;
    private readonly productSatisticRepository;
    private readonly platformStatisticRepository;
    private readonly peakHourStatisticRepository;
    private readonly productVariantRepository;
    constructor(dateConverterProvider: DateConverterProvider, postgresProvider: PostgresProvider, revenueStatisticRepository: typeof RevenueStatistics, productSatisticRepository: typeof ProductSalesStatistics, platformStatisticRepository: typeof PlatformStatistics, peakHourStatisticRepository: typeof PeakHourStatistics, productVariantRepository: typeof ProductVariant);
    getAllStatistic(tenantId: string): Promise<{
        revenue: {
            today: RevenueStatistics | undefined;
            month: RevenueStatistics | undefined;
            daily: RevenueStatistics[];
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
        platform: PlatformStatistics[];
        peakHour: PeakHourStatistics[];
    }>;
}
