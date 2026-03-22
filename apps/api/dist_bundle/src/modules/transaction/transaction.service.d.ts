import { AccountUser, AccountUserAttributes } from 'src/database/models/account-user.model';
import { ProductVariant } from 'src/database/models/product-variant.model';
import { TransactionItem } from 'src/database/models/transaction-item.model';
import { Transaction, TransactionAttributes } from 'src/database/models/transaction.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AccountUserService } from '../account-user/account-user.service';
import { DateConverterProvider } from '../utility/date-converter.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { SnowflakeIdProvider } from '../utility/snowflake-id.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ITransactionGetFilter } from './filter/transaction-get.filter';
export declare class TransactionService {
    private readonly paginationProvider;
    private readonly snowflakeIdProvider;
    private readonly dateConverterProvider;
    private readonly accountUserService;
    private readonly postgresProvider;
    private readonly transactionRepository;
    private readonly transactionItemRepository;
    private readonly accountUserRepository;
    private readonly productVariantRepository;
    constructor(paginationProvider: PaginationProvider, snowflakeIdProvider: SnowflakeIdProvider, dateConverterProvider: DateConverterProvider, accountUserService: AccountUserService, postgresProvider: PostgresProvider, transactionRepository: typeof Transaction, transactionItemRepository: typeof TransactionItem, accountUserRepository: typeof AccountUser, productVariantRepository: typeof ProductVariant);
    findAll(tenantId: string, pagination?: BaseGetAllUrlQuery, filter?: ITransactionGetFilter): Promise<import("../utility/types/pagination.type").IPaginationResponse<Transaction>>;
    findOne(tenantId: string, transactionId: string): Promise<Transaction>;
    create(tenantId: string, createTransactionDto: CreateTransactionDto): Promise<{
        transaction?: TransactionAttributes;
        account_user: (AccountUserAttributes | {
            availability_status: 'NOT_AVAILABLE' | 'COOLDOWN';
            product_variant_id: string;
        })[];
    }>;
    update(tenantId: string, transactionId: string, updateTransactionDto: UpdateTransactionDto): Promise<Transaction>;
    remove(tenantId: string, transactionId: string): Promise<void>;
}
