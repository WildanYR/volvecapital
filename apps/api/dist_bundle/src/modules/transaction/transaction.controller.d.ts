import { AppRequest } from 'src/types/app-request.type';
import { PaginationProvider } from '../utility/pagination.provider';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GetAllTransactionQueryUrlDto } from './dto/get-all-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionService } from './transaction.service';
export declare class TransactionController {
    private readonly transactionService;
    private readonly paginationProvider;
    constructor(transactionService: TransactionService, paginationProvider: PaginationProvider);
    findAll(query: GetAllTransactionQueryUrlDto, request: AppRequest): Promise<import("../utility/types/pagination.type").IPaginationResponse<import("../../database/models/transaction.model").Transaction>>;
    findById(id: string, request: AppRequest): Promise<import("../../database/models/transaction.model").Transaction>;
    create(createTransactionDto: CreateTransactionDto, request: AppRequest): Promise<{
        transaction?: import("../../database/models/transaction.model").TransactionAttributes;
        account_user: (import("../../database/models/account-user.model").AccountUserAttributes | {
            availability_status: "NOT_AVAILABLE" | "COOLDOWN";
            product_variant_id: string;
        })[];
    }>;
    update(transactionId: string, updateTransactionDto: UpdateTransactionDto, request: AppRequest): Promise<import("../../database/models/transaction.model").Transaction>;
    remove(transactionId: string, request: AppRequest): Promise<void>;
}
