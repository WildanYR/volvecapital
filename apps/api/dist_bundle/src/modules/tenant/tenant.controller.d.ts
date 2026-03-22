import { PaginationProvider } from '../utility/pagination.provider';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { GenerateAccessTokenDto } from './dto/generate-access-token.dto';
import { GetAllTenantQueryUrlDto } from './dto/get-all-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantService } from './tenant.service';
export declare class TenantController {
    private readonly tenantService;
    private readonly paginationProvider;
    constructor(tenantService: TenantService, paginationProvider: PaginationProvider);
    findAll(query: GetAllTenantQueryUrlDto): Promise<import("../utility/types/pagination.type").IPaginationResponse<import("../../database/models/tenant.model").Tenant>>;
    findById(id: string): Promise<import("../../database/models/tenant.model").Tenant>;
    create(createTenantDto: CreateTenantDto): Promise<import("../../database/models/tenant.model").Tenant>;
    update(tenantId: string, updateTenantDto: UpdateTenantDto): Promise<import("../../database/models/tenant.model").Tenant>;
    remove(tenantId: string): Promise<void>;
    generateAccessToken(generateAccessTokenDto: GenerateAccessTokenDto): Promise<{
        id: string;
        token: string;
    }>;
}
