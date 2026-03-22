import { AppRequest } from 'src/types/app-request.type';
import { PaginationProvider } from '../utility/pagination.provider';
import { AccountProfileService } from './account-profile.service';
import { CreateAccountProfileDto } from './dto/create-account-profile.dto';
import { GetAllAccountProfileQueryUrlDto } from './dto/get-all-account-profile.dto';
import { UpdateAccountProfileDto } from './dto/update-account-profile.dto';
export declare class AccountProfileController {
    private readonly accountProfileService;
    private readonly paginationProvider;
    constructor(accountProfileService: AccountProfileService, paginationProvider: PaginationProvider);
    findAll(query: GetAllAccountProfileQueryUrlDto, request: AppRequest): Promise<import("../utility/types/pagination.type").IPaginationResponse<import("../../database/models/account-profile.model").AccountProfile>>;
    findById(id: string, request: AppRequest): Promise<import("../../database/models/account-profile.model").AccountProfile>;
    create(createAccountProfileDto: CreateAccountProfileDto, request: AppRequest): Promise<import("../../database/models/account-profile.model").AccountProfile>;
    update(accountProfileId: string, updateAccountProfileDto: UpdateAccountProfileDto, request: AppRequest): Promise<import("../../database/models/account-profile.model").AccountProfile>;
    remove(accountProfileId: string, request: AppRequest): Promise<void>;
}
