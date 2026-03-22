import { Email } from 'src/database/models/email.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { IEmailGetFilter } from './filter/email-get.filter';
export declare class EmailService {
    private readonly paginationProvider;
    private readonly postgresProvider;
    private readonly emailRepository;
    constructor(paginationProvider: PaginationProvider, postgresProvider: PostgresProvider, emailRepository: typeof Email);
    findAll(tenantId: string, pagination?: BaseGetAllUrlQuery, filter?: IEmailGetFilter): Promise<import("../utility/types/pagination.type").IPaginationResponse<Email>>;
    findOne(tenantId: string, emailId: string): Promise<Email>;
    create(tenantId: string, createEmailDto: CreateEmailDto): Promise<Email>;
    update(tenantId: string, emailId: string, updateEmailDto: UpdateEmailDto): Promise<Email>;
    remove(tenantId: string, emailId: string): Promise<void>;
}
