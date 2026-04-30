import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [DatabaseModule, TenantModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
