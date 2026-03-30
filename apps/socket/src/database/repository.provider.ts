import type { Provider } from '@nestjs/common';
import { TASK_QUEUE_REPOSITORY, TENANT_REPOSITORY } from 'src/constants/database.const';
import { TaskQueue } from './models/task-queue.model';
import { Tenant } from './models/tenant.model';

export const RepositoryProvider: Provider[] = [
  { provide: TENANT_REPOSITORY, useValue: Tenant },
  { provide: TASK_QUEUE_REPOSITORY, useValue: TaskQueue },
];
