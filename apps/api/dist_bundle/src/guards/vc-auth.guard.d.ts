import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Tenant } from 'src/database/models/tenant.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AppLoggerService } from 'src/modules/logger/logger.service';
import { TokenProvider } from 'src/modules/utility/token.provider';
export declare class VcAuthGuard implements CanActivate {
    private reflector;
    private logger;
    private configService;
    private tokenProvider;
    private readonly postgresProvider;
    private tenantRepository;
    constructor(reflector: Reflector, logger: AppLoggerService, configService: ConfigService, tokenProvider: TokenProvider, postgresProvider: PostgresProvider, tenantRepository: typeof Tenant);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
