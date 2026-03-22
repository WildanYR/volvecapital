import { AccountProfile } from 'src/database/models/account-profile.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreateAccountProfileDto } from './dto/create-account-profile.dto';
import { UpdateAccountProfileDto } from './dto/update-account-profile.dto';
import { IAccountProfileGetFilter } from './filter/account-profile-get.filter';
export declare class AccountProfileService {
    private readonly paginationProvider;
    private readonly postgresProvider;
    private readonly accountProfileRepository;
    constructor(paginationProvider: PaginationProvider, postgresProvider: PostgresProvider, accountProfileRepository: typeof AccountProfile);
    findAll(tenantId: string, pagination?: BaseGetAllUrlQuery, filter?: IAccountProfileGetFilter): Promise<import("../utility/types/pagination.type").IPaginationResponse<AccountProfile>>;
    findOne(tenantId: string, accountProfileId: string): Promise<AccountProfile>;
    create(tenantId: string, createAccountProfileDto: CreateAccountProfileDto): Promise<AccountProfile>;
    update(tenantId: string, accountProfileId: string, updateAccountProfileDto: UpdateAccountProfileDto): Promise<AccountProfile>;
    remove(tenantId: string, accountProfileId: string): Promise<void>;
}
