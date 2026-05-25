import { Module } from '@nestjs/common';
import { UtilityModule } from '../utility/utility.module';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';

@Module({
  imports: [UtilityModule],
  controllers: [ExpenseController],
  providers: [ExpenseService],
})
export class ExpenseModule {}
