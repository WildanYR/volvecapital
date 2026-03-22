import { AppRequest } from 'src/types/app-request.type';
import { PaginationProvider } from '../utility/pagination.provider';
import { AccountUserService } from './account-user.service';
import { CreateAccountUserDto } from './dto/create-account-user.dto';
import { GetAllAccountUserQueryUrlDto } from './dto/get-all-account-user.dto';
import { UpdateAccountUserDto } from './dto/update-account-user.dto';
export declare class AccountUserController {
    private readonly accountUserService;
    private readonly paginationProvider;
    constructor(accountUserService: AccountUserService, paginationProvider: PaginationProvider);
    findAll(query: GetAllAccountUserQueryUrlDto, request: AppRequest): Promise<import("../utility/types/pagination.type").IPaginationResponse<import("../../database/models/account-user.model").AccountUser>>;
    findById(id: string, request: AppRequest): Promise<import("../../database/models/account-user.model").AccountUser>;
    create(createAccountUserDto: CreateAccountUserDto, request: AppRequest): Promise<import("../../database/models/account-user.model").AccountUser>;
    update(accountUserId: string, updateAccountUserDto: UpdateAccountUserDto, request: AppRequest): Promise<import("../../database/models/account-user.model").AccountUser | null>;
    remove(accountUserId: string, request: AppRequest): Promise<void>;
}
