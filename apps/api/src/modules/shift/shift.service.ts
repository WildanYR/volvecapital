import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ATTENDANCE_REPOSITORY,
  SHIFT_REPOSITORY,
  USER_SHIFT_REPOSITORY,
} from 'src/constants/database.const';
import { Attendance } from 'src/database/models/attendance.model';
import { DashboardUser } from 'src/database/models/dashboard-user.model';
import { Shift } from 'src/database/models/shift.model';
import { UserShift } from 'src/database/models/user-shift.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AppLoggerService } from '../logger/logger.service';
import { AssignShiftDto, CreateShiftDto, UpdateShiftDto } from './dto/shift.dto';

@Injectable()
export class ShiftService {
  constructor(
    @Inject(SHIFT_REPOSITORY) private readonly shiftRepository: typeof Shift,
    @Inject(USER_SHIFT_REPOSITORY) private readonly userShiftRepository: typeof UserShift,
    @Inject(ATTENDANCE_REPOSITORY) private readonly attendanceRepository: typeof Attendance,
    private readonly logger: AppLoggerService,
    private readonly postgresProvider: PostgresProvider,
  ) {}

  async findAll(tenantSchema: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantSchema, transaction);
      const shifts = await this.shiftRepository.findAll({
        transaction,
        order: [['created_at', 'ASC']],
      });
      await transaction.commit();
      return shifts;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async create(tenantSchema: string, payload: CreateShiftDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantSchema, transaction);
      const shift = await this.shiftRepository.create(payload as any, {
        transaction,
      });
      await transaction.commit();
      return shift;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(tenantSchema: string, id: string, payload: UpdateShiftDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantSchema, transaction);
      const shift = await this.shiftRepository.findByPk(id, { transaction });
      if (!shift) {
        throw new NotFoundException('Shift not found');
      }
      await shift.update(payload, { transaction });
      await transaction.commit();
      return shift;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async delete(tenantSchema: string, id: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantSchema, transaction);
      const shift = await this.shiftRepository.findByPk(id, { transaction });
      if (!shift) {
        throw new NotFoundException('Shift not found');
      }
      await shift.destroy({ transaction });
      await transaction.commit();
      return { success: true };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getAssignments(tenantSchema: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantSchema, transaction);
      const assignments = await this.userShiftRepository.findAll({
        where: { is_default: true },
        include: [
          { model: DashboardUser, attributes: ['id', 'name', 'email'] },
          { model: Shift },
        ],
        transaction,
      });
      await transaction.commit();
      return assignments;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async assignShiftToUser(tenantSchema: string, userId: string, payload: AssignShiftDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantSchema, transaction);

      const shift = await this.shiftRepository.findByPk(payload.shift_id, { transaction });
      if (!shift) {
        throw new NotFoundException('Shift not found');
      }

      // Check if user has already started working on the effective_date
      const existingAttendance = await this.attendanceRepository.findOne({
        where: { user_id: userId, attendance_date: payload.effective_date },
        transaction,
      });

      if (existingAttendance && existingAttendance.start_time) {
        throw new BadRequestException('Karyawan sudah mulai bekerja pada tanggal ini, penugasan shift tidak dapat diubah.');
      }

      // Check if there is already an active shift mapping and disable it if so
      await this.userShiftRepository.update(
        { is_default: false },
        {
          where: { user_id: userId, is_default: true },
          transaction,
        }
      );

      const userShift = await this.userShiftRepository.create({
        user_id: userId,
        shift_id: payload.shift_id,
        effective_date: payload.effective_date,
        is_default: true,
      } as any, { transaction });

      await transaction.commit();
      return userShift;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateAssignment(tenantSchema: string, id: string, payload: AssignShiftDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantSchema, transaction);

      const userShift = await this.userShiftRepository.findByPk(id, { transaction });
      if (!userShift) {
        throw new NotFoundException('Penugasan shift tidak ditemukan');
      }

      const shift = await this.shiftRepository.findByPk(payload.shift_id, { transaction });
      if (!shift) {
        throw new NotFoundException('Shift not found');
      }

      const existingAttendance = await this.attendanceRepository.findOne({
        where: { user_id: userShift.user_id, attendance_date: payload.effective_date },
        transaction,
      });

      if (existingAttendance && existingAttendance.start_time) {
        throw new BadRequestException('Karyawan sudah mulai bekerja pada tanggal ini, penugasan shift tidak dapat diubah.');
      }

      await userShift.update({
        shift_id: payload.shift_id,
        effective_date: payload.effective_date,
      }, { transaction });

      await transaction.commit();
      return userShift;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
