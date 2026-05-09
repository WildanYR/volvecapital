import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { TenantModule } from '../tenant/tenant.module';
import { SocketModule } from '../socket/socket.module';
import { AccountModule } from '../account/account.module';
import { PromoModule } from '../promo/promo.module';

@Module({
  imports: [DatabaseModule, TenantModule, SocketModule, AccountModule, PromoModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
