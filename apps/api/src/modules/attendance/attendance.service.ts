import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as moment from 'moment-timezone';
import { Op } from 'sequelize';
import {
  ATTENDANCE_REPOSITORY,
  ATTENDANCE_SETTING_REPOSITORY,
  USER_SHIFT_REPOSITORY,
  WEEKLY_OFF_SCHEDULE_REPOSITORY,
} from 'src/constants/database.const';
import { AttendanceSetting } from 'src/database/models/attendance-setting.model';
import { Attendance } from 'src/database/models/attendance.model';
import { DashboardUser } from 'src/database/models/dashboard-user.model';
import { Role } from 'src/database/models/role.model';
import { Shift } from 'src/database/models/shift.model';
import { UserShift } from 'src/database/models/user-shift.model';
import { WeeklyOffSchedule } from 'src/database/models/weekly-off-schedule.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AppLoggerService } from '../logger/logger.service';
import { AttendanceReportFilterDto, EndAttendanceDto, UpdateAttendanceSettingDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @Inject(ATTENDANCE_REPOSITORY) private readonly attendanceRepository: typeof Attendance,
    @Inject(USER_SHIFT_REPOSITORY) private readonly userShiftRepository: typeof UserShift,
    @Inject(WEEKLY_OFF_SCHEDULE_REPOSITORY) private readonly weeklyOffScheduleRepository: typeof WeeklyOffSchedule,
    @Inject(ATTENDANCE_SETTING_REPOSITORY) private readonly attendanceSettingRepository: typeof AttendanceSetting,
    private readonly logger: AppLoggerService,
    private readonly postgresProvider: PostgresProvider,
  ) {}

  async getTodayStatus(tenantSchema: string, userId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantSchema, transaction);

      const today = moment().tz('Asia/Jakarta');
      const todayStr = today.format('YYYY-MM-DD');
      const dayName = today.format('dddd');

      // Ensure user exists in dashboard_users (for Tenant Owner bypass)
      const userCount = await DashboardUser.count({ where: { id: userId }, transaction });
      if (userCount === 0) {
        const role = await Role.findOne({ transaction });
        if (role) {
          await DashboardUser.create({
            id: userId,
            role_id: role.dataValues.id,
            name: 'Tenant Owner',
            email: 'owner@volvecapital.local',
            password: 'dummy_password',
          } as any, { transaction });
        }
      }

      // Check if weekly off
      const isOff = await this.weeklyOffScheduleRepository.findOne({
        where: { user_id: userId, off_day: dayName, is_active: true },
        transaction,
      });

      if (isOff) {
        await transaction.commit();
        return { is_off: true, status: 'weekly_off', date: todayStr };
      }

      // Find user shift
      const userShift = await this.userShiftRepository.findOne({
        where: { user_id: userId, is_default: true, effective_date: { [Op.lte]: todayStr } },
        include: [{ model: Shift, as: 'shift' }],
        order: [['effective_date', 'DESC']],
        transaction,
      });

      // Find attendance record for today
      let attendance = await this.attendanceRepository.findOne({
        where: { user_id: userId, attendance_date: todayStr },
        include: [{ model: Shift, as: 'shift' }],
        transaction,
      });

      await transaction.commit();

      if (!attendance) {
        return {
          is_off: false,
          status: 'not_started',
          date: todayStr,
          shift: userShift?.shift,
        };
      }

      return {
        is_off: false,
        status: attendance.status,
        date: todayStr,
        attendance,
      };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async startShift(tenantSchema: string, userId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantSchema, transaction);

      const today = moment().tz('Asia/Jakarta');
      const todayStr = today.format('YYYY-MM-DD');
      const currentTime = new Date();

      // Check if already started
      const existing = await this.attendanceRepository.findOne({
        where: { user_id: userId, attendance_date: todayStr },
        transaction,
      });

      if (existing) {
        throw new BadRequestException('You have already started your shift today');
      }

      // Check if weekly off
      const dayName = today.format('dddd');
      const isOff = await this.weeklyOffScheduleRepository.findOne({
        where: { user_id: userId, off_day: dayName, is_active: true },
        transaction,
      });

      if (isOff) {
        throw new BadRequestException('Today is your scheduled day off');
      }

      // Ensure user exists in dashboard_users (for Tenant Owner bypass)
      const userCount = await DashboardUser.count({ where: { id: userId }, transaction });
      if (userCount === 0) {
        const role = await Role.findOne({ transaction });
        if (role) {
          await DashboardUser.create({
            id: userId,
            role_id: role.dataValues.id,
            name: 'Tenant Owner',
            email: 'owner@volvecapital.local',
            password: 'dummy_password',
          } as any, { transaction });
        }
      }

      // Get user shift
      const userShift = await this.userShiftRepository.findOne({
        where: { user_id: userId, is_default: true, effective_date: { [Op.lte]: todayStr } },
        include: [{ model: Shift, as: 'shift' }],
        order: [['effective_date', 'DESC']],
        transaction,
      });

      let shiftId: string | null = null;
      let lateMinutes = 0;

      if (userShift && userShift.shift) {
        shiftId = userShift.shift_id;
        // Calculate Late
        const setting = await this.attendanceSettingRepository.findOne({ transaction });
        const tolerance = setting ? setting.late_tolerance_minutes : 10;

        const shiftStartTime = moment.tz(`${todayStr} ${userShift.shift.start_time}`, 'YYYY-MM-DD HH:mm:ss', userShift.shift.timezone || 'Asia/Jakarta');
        const shiftStartTimeWithTolerance = shiftStartTime.clone().add(tolerance, 'minutes');

        if (today.isAfter(shiftStartTimeWithTolerance)) {
          lateMinutes = today.diff(shiftStartTime, 'minutes');
        }
      }

      const attendance = await this.attendanceRepository.create({
        user_id: userId,
        shift_id: shiftId,
        attendance_date: todayStr,
        start_time: currentTime,
        status: 'working',
        late_minutes: lateMinutes,
      } as any, { transaction });

      await transaction.commit();
      return attendance;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async endShift(tenantSchema: string, userId: string, payload: EndAttendanceDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantSchema, transaction);

      const today = moment().tz('Asia/Jakarta');
      const todayStr = today.format('YYYY-MM-DD');
      const currentTime = new Date();

      const attendance = await this.attendanceRepository.findOne({
        where: { user_id: userId, attendance_date: todayStr },
        include: [{ model: Shift, as: 'shift' }],
        transaction,
      });

      if (!attendance) {
        throw new BadRequestException('You have not started your shift today');
      }

      if (attendance.status === 'completed' || attendance.end_time) {
        throw new BadRequestException('You have already ended your shift today');
      }

      // Calculate Early Leave
      let earlyLeaveMinutes = 0;
      if (attendance.shift) {
        const shiftEndTime = moment.tz(`${todayStr} ${attendance.shift.end_time}`, 'YYYY-MM-DD HH:mm:ss', attendance.shift.timezone || 'Asia/Jakarta');

        if (today.isBefore(shiftEndTime)) {
          earlyLeaveMinutes = shiftEndTime.diff(today, 'minutes');
        }
      }

      // Calculate total work minutes
      const startMoment = moment(attendance.start_time);
      const totalWorkMinutes = today.diff(startMoment, 'minutes');

      // Determine final status
      let finalStatus = 'completed';
      if (attendance.late_minutes > 0 && earlyLeaveMinutes > 0) {
        finalStatus = 'late_and_early_leave';
      }
      else if (attendance.late_minutes > 0) {
        finalStatus = 'late';
      }
      else if (earlyLeaveMinutes > 0) {
        finalStatus = 'early_leave';
      }

      await attendance.update({
        end_time: currentTime,
        status: finalStatus,
        early_leave_minutes: earlyLeaveMinutes,
        total_work_minutes: totalWorkMinutes,
        work_summary: payload.work_summary,
      }, { transaction });

      await transaction.commit();
      return attendance;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getMyStats(tenantSchema: string, userId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantSchema, transaction);
      const startOfMonth = moment().tz('Asia/Jakarta').startOf('month').format('YYYY-MM-DD');
      const endOfMonth = moment().tz('Asia/Jakarta').endOf('month').format('YYYY-MM-DD');

      const attendances = await this.attendanceRepository.findAll({
        where: {
          user_id: userId,
          attendance_date: { [Op.between]: [startOfMonth, endOfMonth] },
        },
        transaction,
      });

      await transaction.commit();

      let totalPresent = 0;
      let totalLate = 0;
      let totalWorkMinutes = 0;

      for (const att of attendances) {
        if (att.status !== 'absent' && att.status !== 'weekly_off' && att.status !== 'not_started') {
          totalPresent++;
        }
        if (att.late_minutes > 0) {
          totalLate++;
        }
        if (att.total_work_minutes) {
          totalWorkMinutes += att.total_work_minutes;
        }
      }

      return {
        total_present: totalPresent,
        total_late: totalLate,
        total_work_hours: Math.floor(totalWorkMinutes / 60),
      };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getMyHistory(tenantSchema: string, userId: string, filter: string = '30days') {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantSchema, transaction);

      let dateFilter = {};
      const today = moment().tz('Asia/Jakarta');

      if (filter === 'day') {
        dateFilter = { attendance_date: today.format('YYYY-MM-DD') };
      }
      else if (filter === 'week') {
        dateFilter = { attendance_date: { [Op.gte]: today.startOf('isoWeek').format('YYYY-MM-DD') } };
      }
      else if (filter === 'month') {
        dateFilter = { attendance_date: { [Op.gte]: today.startOf('month').format('YYYY-MM-DD') } };
      }
      else {
        // default 30 days
        dateFilter = { attendance_date: { [Op.gte]: today.subtract(30, 'days').format('YYYY-MM-DD') } };
      }

      const history = await this.attendanceRepository.findAll({
        where: { user_id: userId, ...dateFilter },
        include: [{ model: Shift, as: 'shift' }],
        order: [['attendance_date', 'DESC']],
        limit: filter === '30days' ? 30 : undefined,
        transaction,
      });
      await transaction.commit();
      return history;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getAdminAttendanceList(tenantSchema: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantSchema, transaction);
      const todayStr = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');

      const attendances = await this.attendanceRepository.findAll({
        where: { attendance_date: todayStr },
        include: [
          { model: DashboardUser, as: 'user', attributes: ['id', 'name', 'email'] },
          { model: Shift, as: 'shift' },
        ],
        transaction,
      });
      await transaction.commit();
      return attendances;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getAdminDashboardStats(tenantSchema: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantSchema, transaction);
      const todayStr = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');

      const attendances = await this.attendanceRepository.findAll({
        where: { attendance_date: todayStr },
        transaction,
      });

      const activeUsersCount = await DashboardUser.count({
        where: { is_active: true },
        transaction,
      });

      await transaction.commit();

      let working = 0;
      let late = 0;
      let weeklyOff = 0;
      let missingCheckout = 0;

      for (const att of attendances) {
        if (att.status === 'working')
          working++;
        if (att.status === 'weekly_off')
          weeklyOff++;
        if (att.status === 'missing_checkout')
          missingCheckout++;
        if (att.late_minutes > 0)
          late++;
      }

      const notStarted = activeUsersCount - attendances.length;

      return {
        working,
        not_started: notStarted > 0 ? notStarted : 0,
        late,
        weekly_off: weeklyOff,
        missing_checkout: missingCheckout,
      };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getAdminReport(tenantSchema: string, query: AttendanceReportFilterDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantSchema, transaction);

      // default to this month if no date provided
      const startDate = query.start_date || moment().tz('Asia/Jakarta').startOf('month').format('YYYY-MM-DD');
      const endDate = query.end_date || moment().tz('Asia/Jakarta').endOf('month').format('YYYY-MM-DD');

      const whereClause: any = {
        attendance_date: { [Op.between]: [startDate, endDate] },
      };

      if (query.user_id) {
        whereClause.user_id = query.user_id;
      }
      if (query.shift_id) {
        whereClause.shift_id = query.shift_id;
      }

      const attendances = await this.attendanceRepository.findAll({
        where: whereClause,
        include: [
          { model: DashboardUser, as: 'user', attributes: ['id', 'name'] },
          { model: Shift, as: 'shift', attributes: ['id', 'name'] },
        ],
        transaction,
      });

      await transaction.commit();

      // Aggregate by user
      const userMap = new Map<string, any>();

      for (const att of attendances) {
        if (!att.user)
          continue;

        if (!userMap.has(att.user_id)) {
          userMap.set(att.user_id, {
            user_id: att.user_id,
            name: att.user.name,
            work_days: 0,
            off_days: 0,
            present: 0,
            late: 0,
            early_leave: 0,
            absent: 0,
            missing_checkout: 0,
            total_work_hours: 0,
          });
        }

        const stats = userMap.get(att.user_id);
        stats.work_days++;

        if (att.status === 'weekly_off') {
          stats.off_days++;
        }
        else if (att.status === 'absent') {
          stats.absent++;
        }
        else if (att.status === 'missing_checkout') {
          stats.missing_checkout++;
          stats.present++;
        }
        else if (att.status !== 'not_started') {
          stats.present++;
        }

        if (att.late_minutes > 0)
          stats.late++;
        if (att.early_leave_minutes > 0)
          stats.early_leave++;
        if (att.total_work_minutes > 0) {
          stats.total_work_hours += (att.total_work_minutes / 60);
        }
      }

      // Format work hours to 1 decimal place
      const report = Array.from(userMap.values()).map(r => ({
        ...r,
        total_work_hours: Math.round(r.total_work_hours * 10) / 10,
      }));

      return report;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getAttendanceSetting(tenantSchema: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantSchema, transaction);

      let setting = await this.attendanceSettingRepository.findOne({ transaction });
      if (!setting) {
        setting = await this.attendanceSettingRepository.create({
          late_tolerance_minutes: 10,
          max_off_per_day: 1,
        } as any, { transaction });
      }

      await transaction.commit();
      return setting;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateAttendanceSetting(tenantSchema: string, payload: UpdateAttendanceSettingDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantSchema, transaction);

      let setting = await this.attendanceSettingRepository.findOne({ transaction });
      if (!setting) {
        setting = await this.attendanceSettingRepository.create(payload as any, { transaction });
      }
      else {
        await setting.update(payload, { transaction });
      }

      await transaction.commit();
      return setting;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
