import { AppRequest } from 'src/types/app-request.type';
import { PaginationProvider } from '../utility/pagination.provider';
import { CreateEmailDto } from './dto/create-email.dto';
import { GetAllEmailQueryUrlDto } from './dto/get-all-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { EmailService } from './email.service';
export declare class EmailController {
    private readonly emailService;
    private readonly paginationProvider;
    constructor(emailService: EmailService, paginationProvider: PaginationProvider);
    findAll(query: GetAllEmailQueryUrlDto, request: AppRequest): Promise<import("../utility/types/pagination.type").IPaginationResponse<import("../../database/models/email.model").Email>>;
    findById(id: string, request: AppRequest): Promise<import("../../database/models/email.model").Email>;
    create(createEmailDto: CreateEmailDto, request: AppRequest): Promise<import("../../database/models/email.model").Email>;
    update(emailId: string, updateEmailDto: UpdateEmailDto, request: AppRequest): Promise<import("../../database/models/email.model").Email>;
    remove(emailId: string, request: AppRequest): Promise<void>;
}
