import { Tenant } from 'src/database/models/tenant.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { TokenProvider } from '../utility/token.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { GenerateAccessTokenDto } from './dto/generate-access-token.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ITenantGetFilter } from './filter/tenant-get.filter';
export declare class TenantService {
    private readonly paginationProvider;
    private readonly tokenProvider;
    private readonly postgresProvider;
    private readonly tenantRepository;
    constructor(paginationProvider: PaginationProvider, tokenProvider: TokenProvider, postgresProvider: PostgresProvider, tenantRepository: typeof Tenant);
    findAll(pagination?: BaseGetAllUrlQuery, filter?: ITenantGetFilter): Promise<import("../utility/types/pagination.type").IPaginationResponse<Tenant>>;
    findOne(tenantId: string): Promise<Tenant>;
    create(createTenantDto: CreateTenantDto): Promise<Tenant>;
    update(tenantId: string, updateTenantDto: UpdateTenantDto): Promise<Tenant>;
    remove(tenantId: string): Promise<void>;
    generateAccessToken(generateAccessTokenDto: GenerateAccessTokenDto): Promise<{
        id: string;
        token: string;
    }>;
}
