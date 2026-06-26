import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ATTENDANCE_SETTING_REPOSITORY,
  WEEKLY_OFF_REQUEST_REPOSITORY,
  WEEKLY_OFF_SCHEDULE_REPOSITORY,
} from 'src/constants/database.const';
import { AttendanceSetting } from 'src/database/models/attendance-setting.model';
import { DashboardUser } from 'src/database/models/dashboard-user.model';
import { WeeklyOffRequest } from 'src/database/models/weekly-off-request.model';
import { WeeklyOffSchedule } from 'src/database/models/weekly-off-schedule.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AppLoggerService } from '../logger/logger.service';
import { RejectWeeklyOffDto, RequestWeeklyOffDto } from './dto/weekly-off.dto';

@Injectable()
export class WeeklyOffService {
  constructor(
    @Inject(WEEKLY_OFF_SCHEDULE_REPOSITORY) private readonly scheduleRepository: typeof WeeklyOffSchedule,
    @Inject(WEEKLY_OFF_REQUEST_REPOSITORY) private readonly requestRepository: typeof WeeklyOffRequest,
    @Inject(ATTENDANCE_SETTING_REPOSITORY) private readonly settingRepository: typeof AttendanceSetting,
    private readonly logger: AppLoggerService,
    private readonly postgresProvider: PostgresProvider,
  ) {}

  async getMyScheduleAndRequests(tenantSchema: string, userId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantSchema, transaction);
      const schedule = await this.scheduleRepository.findOne({
        where: { user_id: userId, is_active: true },
        transaction,
      });
      const requests = await this.requestRepository.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        transaction,
      });
      await transaction.commit();
      return { schedule, requests };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getAllRequests(tenantSchema: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantSchema, transaction);
      const requests = await this.requestRepository.findAll({
        include: [{ model: DashboardUser, as: 'user', attributes: ['id', 'name', 'email'] }],
        order: [['created_at', 'DESC']],
        transaction,
      });
      await transaction.commit();
      return requests;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async requestOffDay(tenantSchema: string, userId: string, payload: RequestWeeklyOffDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantSchema, transaction);

      const day = payload.requested_off_day.toLowerCase();
      if (['friday', 'saturday', 'sunday', 'jumat', 'sabtu', 'minggu'].includes(day)) {
        throw new BadRequestException('Cannot select weekend for weekly off');
      }

      // Check existing active schedule
      const currentSchedule = await this.scheduleRepository.findOne({
        where: { user_id: userId, is_active: true },
        transaction,
      });

      const request = await this.requestRepository.create({
        user_id: userId,
        current_off_day: currentSchedule?.off_day,
        requested_off_day: payload.requested_off_day,
        note: payload.note,
        status: 'pending',
      } as any, { transaction });

      await transaction.commit();
      return request;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async approveRequest(tenantSchema: string, adminId: string | null, requestId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantSchema, transaction);

      const request = await this.requestRepository.findByPk(requestId, { transaction });
      if (!request || request.status !== 'pending') {
        throw new NotFoundException('Pending request not found');
      }

      // Check max_off_per_day
      const setting = await this.settingRepository.findOne({ transaction });
      const maxOff = setting ? setting.max_off_per_day : 1;

      const activeForRequestedDay = await this.scheduleRepository.count({
        where: { off_day: request.requested_off_day, is_active: true },
        transaction,
      });

      if (activeForRequestedDay >= maxOff) {
        throw new BadRequestException(`Maximum off quota reached for ${request.requested_off_day}`);
      }

      // Deactivate old schedule
      await this.scheduleRepository.update(
        { is_active: false },
        { where: { user_id: request.user_id, is_active: true }, transaction }
      );

      // Create new schedule
      await this.scheduleRepository.create({
        user_id: request.user_id,
        off_day: request.requested_off_day,
        is_active: true,
        approved_by: adminId,
        approved_at: new Date(),
      } as any, { transaction });

      // Update request
      await request.update({
        status: 'approved',
        approved_by: adminId,
        approved_at: new Date(),
      }, { transaction });

      await transaction.commit();
      return request;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async rejectRequest(tenantSchema: string, adminId: string | null, requestId: string, payload: RejectWeeklyOffDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantSchema, transaction);

      const request = await this.requestRepository.findByPk(requestId, { transaction });
      if (!request || request.status !== 'pending') {
        throw new NotFoundException('Pending request not found');
      }

      await request.update({
        status: 'rejected',
        approved_by: adminId,
        approved_at: new Date(),
        note: payload.note || request.note,
      }, { transaction });

      await transaction.commit();
      return request;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
