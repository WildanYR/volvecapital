import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const secret = this.configService.get<string>('app.internalSecret');
    const header = req.headers['x-internal-secret'];

    if (!secret || header !== secret) {
      throw new UnauthorizedException('Invalid internal secret');
    }

    return true;
  }
}
