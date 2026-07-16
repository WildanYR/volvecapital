import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { AccountModule } from '../account/account.module';
import { AccountingModule } from '../accounting/accounting.module';
import { PromoModule } from '../promo/promo.module';
import { SocketModule } from '../socket/socket.module';
import { TenantModule } from '../tenant/tenant.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  imports: [DatabaseModule, TenantModule, SocketModule, AccountModule, PromoModule, AccountingModule, WhatsappModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
