import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { TENANT_REPOSITORY } from 'src/constants/database.const';
import { Tenant } from 'src/database/models/tenant.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AppLoggerService } from 'src/modules/logger/logger.service';
import { TokenProvider } from 'src/modules/utility/token.provider';
import { IAccessTokenPayload } from 'src/types/access-token.type';
import { AppRequest } from 'src/types/app-request.type';
import { Roles } from 'src/types/roles.type';
import { PUBLIC_ROUTE } from './public-route.decorator';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class VcAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private logger: AppLoggerService,
    private configService: ConfigService,
    private tokenProvider: TokenProvider,
    private readonly postgresProvider: PostgresProvider,
    @Inject(TENANT_REPOSITORY) private tenantRepository: typeof Tenant,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic)
      return true;

    const req = context.switchToHttp().getRequest<AppRequest>();
    const authHeader = req.headers.authorization as string;
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    // Format: VC {TOKEN}
    const [authType, token] = authHeader.split(' ');
    if (authType !== 'VC' || !token) {
      throw new UnauthorizedException('Invalid Authorization header format');
    }

    const tokenPayload
      = this.tokenProvider.decodeJwt<IAccessTokenPayload>(token);

    const rolesCheck = this.reflector.getAllAndOverride<Array<Roles>>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!!rolesCheck && rolesCheck.length) {
      const hasRole = rolesCheck.includes(tokenPayload.role);
      if (!hasRole) {
        throw new ForbiddenException('Action Forbidden');
      }
    }

    let tenant: Tenant | null = null;
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);
      tenant = await this.tenantRepository.findOne({
        where: { id: tokenPayload.tenant_id },
        transaction,
      });
      await transaction.commit();
    }
    catch (error) {
      this.logger.error(
        `Get Tenant from DB Error: ${(error as Error).message}`,
        (error as Error).stack,
        'VCAuthGuard',
      );
      await transaction.rollback();
      throw new InternalServerErrorException(
        'Get tenant from database error',
      );
    }

    const secret = tenant?.dataValues.secret
      ?? this.configService.get<string>('token.secret');

    if (!secret) {
      throw new UnauthorizedException('Missing secret');
    }

    try {
      const payload = await this.tokenProvider.verifyJwt<IAccessTokenPayload>(
        secret,
        token,
      );

      req.user = payload;

      const tenant_id = req.headers['x-tenant-id'] as string;
      if (!tenant_id) {
        throw new NotFoundException('Missing tenant id');
      }

      if (tenant && tenant_id !== payload.tenant_id) {
        throw new UnauthorizedException('Tenant mismatch');
      }

      req.tenant_id = tenant_id;

      return true;
    }
    catch (e) {
      if (e instanceof NotFoundException) {
        throw e;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
