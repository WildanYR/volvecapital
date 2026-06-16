import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Op } from 'sequelize';
import * as moment from 'moment-timezone';
import {
  ATTENDANCE_REPOSITORY,
  DASHBOARD_USER_REPOSITORY,
  TENANT_REPOSITORY,
  USER_SHIFT_REPOSITORY,
  WEEKLY_OFF_SCHEDULE_REPOSITORY,
} from 'src/constants/database.const';
import { Attendance } from 'src/database/models/attendance.model';
import { DashboardUser } from 'src/database/models/dashboard-user.model';
import { Tenant } from 'src/database/models/tenant.model';
import { UserShift } from 'src/database/models/user-shift.model';
import { WeeklyOffSchedule } from 'src/database/models/weekly-off-schedule.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AppLoggerService } from '../logger/logger.service';

@Injectable()
export class AttendanceCronService {
  constructor(
    @Inject(TENANT_REPOSITORY) private readonly tenantRepository: typeof Tenant,
    @Inject(DASHBOARD_USER_REPOSITORY) private readonly userRepository: typeof DashboardUser,
    @Inject(ATTENDANCE_REPOSITORY) private readonly attendanceRepository: typeof Attendance,
    @Inject(USER_SHIFT_REPOSITORY) private readonly userShiftRepository: typeof UserShift,
    @Inject(WEEKLY_OFF_SCHEDULE_REPOSITORY) private readonly weeklyOffScheduleRepository: typeof WeeklyOffSchedule,
    private readonly postgresProvider: PostgresProvider,
    private readonly logger: AppLoggerService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'Asia/Jakarta',
  })
  async processMissingCheckoutAndAbsent() {
    this.logger.log('Starting daily attendance check cron...', 'AttendanceCron');
    
    // Using yesterday's date because it runs at 00:00 for the previous day
    const yesterday = moment().tz('Asia/Jakarta').subtract(1, 'day');
    const yesterdayStr = yesterday.format('YYYY-MM-DD');
    const dayName = yesterday.format('dddd');

    const tenants = await this.tenantRepository.findAll();

    for (const tenant of tenants) {
      const transaction = await this.postgresProvider.transaction();
      try {
        await this.postgresProvider.setSchema(tenant.id, transaction);
        
        // 1. Mark Missing Checkout
        // If status is 'working' and attendance_date is yesterday, it means they forgot to end shift
        const missingCheckouts = await this.attendanceRepository.findAll({
          where: { attendance_date: yesterdayStr, status: 'working' },
          transaction,
        });

        for (const record of missingCheckouts) {
          await record.update({ status: 'missing_checkout' }, { transaction });
          this.logger.log(`Marked missing_checkout for user ${record.user_id} in tenant ${tenant.id}`, 'AttendanceCron');
        }

        // 2. Mark Absent
        // For all active users, check if they have a shift, if they didn't have weekly off, and if they have no attendance record
        const activeUsers = await this.userRepository.findAll({
          where: { is_active: true },
          transaction,
        });

        for (const user of activeUsers) {
          // Check if weekly off
          const isOff = await this.weeklyOffScheduleRepository.findOne({
            where: { user_id: user.id, off_day: dayName, is_active: true },
            transaction,
          });

          if (isOff) continue;

          // Check if user has shift
          const userShift = await this.userShiftRepository.findOne({
            where: { user_id: user.id, is_default: true, effective_date: { [Op.lte]: yesterdayStr } },
            transaction,
          });

          if (!userShift) continue;

          // Check if attendance exists
          const attendance = await this.attendanceRepository.findOne({
            where: { user_id: user.id, attendance_date: yesterdayStr },
            transaction,
          });

          if (!attendance) {
            await this.attendanceRepository.create({
              user_id: user.id,
              shift_id: userShift.shift_id,
              attendance_date: yesterdayStr,
              status: 'absent',
            } as any, { transaction });
            this.logger.log(`Marked absent for user ${user.id} in tenant ${tenant.id}`, 'AttendanceCron');
          }
        }

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        this.logger.error(`Error processing attendance cron for tenant ${tenant.id}: ${(error as Error).message}`, (error as Error).stack, 'AttendanceCron');
      }
    }
  }
}
