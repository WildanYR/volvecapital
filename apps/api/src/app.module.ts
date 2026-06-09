import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfig } from './configs/app.config';
import { DatabaseConfig } from './configs/database.config';
import { RedisConfig } from './configs/redis.config';
import { TokenConfig } from './configs/token.config';
import { DatabaseModule } from './database/database.module';
import { VcAuthGuard } from './guards/vc-auth.guard';
import { AccountProfileModule } from './modules/account-profile/account-profile.module';
import { AccountUserModule } from './modules/account-user/account-user.module';
import { AccountModule } from './modules/account/account.module';
import { EmailMessageModule } from './modules/email-message/email-message.module';
import { EmailSubjectModule } from './modules/email-subject/email-subject.module';
import { EmailModule } from './modules/email/email.module';
import { ExpenseModule } from './modules/expense/expense.module';
import { AppLoggerModule } from './modules/logger/logger.module';
import { PlatformProductModule } from './modules/platform-product/platform-product.module';
import { ProductVariantModule } from './modules/product-variant/product-variant.module';
import { ProductModule } from './modules/product/product.module';
import { RedisModule } from './modules/redis/redis.module';
import { SocketModule } from './modules/socket/socket.module';
import { StatisticModule } from './modules/statistic/statistic.module';
import { TaskQueueModule } from './modules/task-queue/task-queue.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { UtilityModule } from './modules/utility/utility.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [
        AppConfig,
        TokenConfig,
        RedisConfig,
        DatabaseConfig,
      ],
    }),
    DatabaseModule,
    UtilityModule,
    AppLoggerModule,
    RedisModule,
    CacheModule.register({
      isGlobal: true,
      ttl: 10000,
    }),
    TenantModule,
    TaskQueueModule,
    SocketModule,
    EmailModule,
    EmailMessageModule,
    ProductModule,
    ProductVariantModule,
    PlatformProductModule,
    AccountModule,
    ExpenseModule,
    AccountProfileModule,
    AccountUserModule,
    TransactionModule,
    StatisticModule,
    EmailSubjectModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: VcAuthGuard }, AppService],
})
export class AppModule {}
