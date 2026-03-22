import { AppRequest } from 'src/types/app-request.type';
import { PaginationProvider } from '../utility/pagination.provider';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { FreezeAccountDto } from './dto/freeze-account.dto';
import { GetAllAccountQueryUrlDto } from './dto/get-all-account.dto';
import { UpdateAccountModifierDto } from './dto/update-account-modifier.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
export declare class AccountController {
    private readonly accountService;
    private readonly paginationProvider;
    constructor(accountService: AccountService, paginationProvider: PaginationProvider);
    findAll(query: GetAllAccountQueryUrlDto, request: AppRequest): Promise<import("../utility/types/pagination.type").IPaginationResponse<import("../../database/models/account.model").Account>>;
    countStatusAccount(productVariantId: string, request: AppRequest): Promise<{
        accounts_with_slots: number;
        accounts_full: number;
        profiles_available: number;
        accounts_disabled_or_frozen: number;
        profiles_locked_but_has_slot: number;
        accounts_expiring_today: number;
    }>;
    findById(id: string, request: AppRequest): Promise<import("../../database/models/account.model").Account>;
    create(createAccountDto: CreateAccountDto, request: AppRequest): Promise<import("../../database/models/account.model").Account | null>;
    update(accountId: string, updateAccountDto: UpdateAccountDto, request: AppRequest): Promise<import("../../database/models/account.model").Account>;
    updateAccountModifier(accountId: string, updateAccountModifierDto: UpdateAccountModifierDto, request: AppRequest): Promise<void>;
    freezeAccount(accountId: string, freezeAccountDto: FreezeAccountDto, request: AppRequest): Promise<void>;
    unfreezeAccount(accountId: string, request: AppRequest): Promise<void>;
    remove(accountId: string, request: AppRequest): Promise<void>;
}
