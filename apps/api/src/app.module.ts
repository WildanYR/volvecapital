import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfig } from './configs/app.config';
import { DatabaseConfig } from './configs/database.config';
import { RedisConfig } from './configs/redis.config';
import { TokenConfig } from './configs/token.config';
import { VoucherConfig } from './configs/voucher.config';
import { MidtransConfig } from './configs/midtrans.config';
import { DokuConfig } from './configs/doku.config';
import { MailConfig } from './configs/mail.config';
import { DatabaseModule } from './database/database.module';
import { VcAuthGuard } from './guards/vc-auth.guard';
import { AccountProfileModule } from './modules/account-profile/account-profile.module';
import { AccountUserModule } from './modules/account-user/account-user.module';
import { AccountModule } from './modules/account/account.module';
import { CronModule } from './modules/cron/cron.module';
import { EmailForwardModule } from './modules/email-forward/email-forward.module';
import { EmailModule } from './modules/email/email.module';
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
import { PublicModule } from './modules/public/public.module';
import { VoucherModule } from './modules/voucher/voucher.module';
import { SettingModule } from './modules/setting/setting.module';
import { EmailMessageModule } from './modules/email-message/email-message.module';
import { EmailSubjectModule } from './modules/email-subject/email-subject.module';
import { TutorialModule } from './modules/tutorial/tutorial.module';
import { ArticleModule } from './modules/article/article.module';

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
        VoucherConfig,
        MidtransConfig,
        DokuConfig,
        MailConfig,
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
    ScheduleModule.forRoot(),
    CronModule,
    TenantModule,
    TaskQueueModule,
    SocketModule,
    EmailModule,
    ProductModule,
    ProductVariantModule,
    PlatformProductModule,
    AccountModule,
    AccountProfileModule,
    AccountUserModule,
    TransactionModule,
    StatisticModule,
    EmailForwardModule,
    PublicModule,
    VoucherModule,
    SettingModule,
    EmailMessageModule,
    EmailSubjectModule,
    TutorialModule,
    ArticleModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: VcAuthGuard }, AppService],
})
export class AppModule {}
