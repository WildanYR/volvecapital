import type { Provider } from '@nestjs/common';
import {
  ACCOUNT_MODIFIER_REPOSITORY,
  ACCOUNT_PROFILE_REPOSITORY,
  ACCOUNT_REPOSITORY,
  ACCOUNT_USER_REPOSITORY,
  EMAIL_REPOSITORY,
  EMAIL_SUBJECT_REPOSITORY,
  PEAK_HOUR_STATISTICS_REPOSITORY,
  PLATFORM_PRODUCT_REPOSITORY,
  PLATFORM_STATISTICS_REPOSITORY,
  PRODUCT_REPOSITORY,
  PRODUCT_SALES_STATISTICS_REPOSITORY,
  PRODUCT_VARIANT_REPOSITORY,
  REVENUE_STATISTICS_REPOSITORY,
  SYSLOG_REPOSITORY,
  TASK_QUEUE_REPOSITORY,
  TENANT_REPOSITORY,
  TRANSACTION_ITEM_REPOSITORY,
  TRANSACTION_REPOSITORY,
} from 'src/constants/database.const';
import { AccountModifier } from './models/account-modifier.model';
import { AccountProfile } from './models/account-profile.model';
import { AccountUser } from './models/account-user.model';
import { Account } from './models/account.model';
import { EmailSubject } from './models/email-subject.model';
import { Email } from './models/email.model';
import { PeakHourStatistics } from './models/peak-hour-statistics.model';
import { PlatformProduct } from './models/platform-product.model';
import { PlatformStatistics } from './models/platform-statistics.model';
import { ProductSalesStatistics } from './models/product-sales-statistics.model';
import { ProductVariant } from './models/product-variant.model';
import { Product } from './models/product.model';
import { RevenueStatistics } from './models/revenue-statistics.model';
import { Syslog } from './models/syslog.model';
import { TaskQueue } from './models/task-queue.model';
import { Tenant } from './models/tenant.model';
import { TransactionItem } from './models/transaction-item.model';
import { Transaction } from './models/transaction.model';

export const RepositoryProvider: Provider[] = [
  { provide: TENANT_REPOSITORY, useValue: Tenant },
  { provide: TASK_QUEUE_REPOSITORY, useValue: TaskQueue },
  { provide: EMAIL_REPOSITORY, useValue: Email },
  { provide: PRODUCT_REPOSITORY, useValue: Product },
  { provide: PRODUCT_VARIANT_REPOSITORY, useValue: ProductVariant },
  { provide: PLATFORM_PRODUCT_REPOSITORY, useValue: PlatformProduct },
  { provide: ACCOUNT_REPOSITORY, useValue: Account },
  { provide: ACCOUNT_PROFILE_REPOSITORY, useValue: AccountProfile },
  { provide: ACCOUNT_USER_REPOSITORY, useValue: AccountUser },
  { provide: ACCOUNT_MODIFIER_REPOSITORY, useValue: AccountModifier },
  { provide: TRANSACTION_REPOSITORY, useValue: Transaction },
  { provide: TRANSACTION_ITEM_REPOSITORY, useValue: TransactionItem },
  { provide: REVENUE_STATISTICS_REPOSITORY, useValue: RevenueStatistics },
  {
    provide: PRODUCT_SALES_STATISTICS_REPOSITORY,
    useValue: ProductSalesStatistics,
  },
  { provide: PEAK_HOUR_STATISTICS_REPOSITORY, useValue: PeakHourStatistics },
  { provide: PLATFORM_STATISTICS_REPOSITORY, useValue: PlatformStatistics },
  { provide: EMAIL_SUBJECT_REPOSITORY, useValue: EmailSubject },
  { provide: SYSLOG_REPOSITORY, useValue: Syslog },
];
