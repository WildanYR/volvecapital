import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PERMISSION_REPOSITORY,
  ROLE_PERMISSION_REPOSITORY,
  ROLE_REPOSITORY,
} from 'src/constants/database.const';
import { Permission } from 'src/database/models/permission.model';
import { RolePermission } from 'src/database/models/role-permission.model';
import { Role } from 'src/database/models/role.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(
    private readonly postgresProvider: PostgresProvider,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: typeof Role,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionRepository: typeof Permission,
    @Inject(ROLE_PERMISSION_REPOSITORY) private readonly rolePermissionRepository: typeof RolePermission,
  ) {}

  async findAll(tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const roles = await this.roleRepository.findAll({
        include: [{ model: Permission, through: { attributes: [] } }],
        transaction,
      });
      await transaction.commit();
      return roles;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findOne(id: string, tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const role = await this.roleRepository.findOne({
        where: { id },
        include: [{ model: Permission, through: { attributes: [] } }],
        transaction,
      });
      await transaction.commit();
      if (!role) throw new NotFoundException(`Role dengan id ${id} tidak ditemukan`);
      return role;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async create(dto: CreateRoleDto, tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const role = await this.roleRepository.create(
        { name: dto.name, description: dto.description },
        { transaction },
      );

      if (dto.permission_ids && dto.permission_ids.length > 0) {
        const rolePermissions = dto.permission_ids.map(permission_id => ({
          role_id: role.id,
          permission_id,
        }));
        await this.rolePermissionRepository.bulkCreate(rolePermissions as any, { transaction });
      }

      await transaction.commit();
      return this.findOne(role.id, tenantId);
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(id: string, dto: UpdateRoleDto, tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const role = await this.roleRepository.findOne({ where: { id }, transaction });
      if (!role) throw new NotFoundException(`Role dengan id ${id} tidak ditemukan`);
      await role.update({ ...dto }, { transaction });
      await transaction.commit();
      return this.findOne(id, tenantId);
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async setPermissions(id: string, permissionIds: string[], tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const role = await this.roleRepository.findOne({ where: { id }, transaction });
      if (!role) throw new NotFoundException(`Role dengan id ${id} tidak ditemukan`);

      // Delete existing permissions for this role
      await this.rolePermissionRepository.destroy({
        where: { role_id: id },
        transaction,
      });

      // Insert new permissions
      if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map(permission_id => ({
          role_id: id,
          permission_id,
        }));
        await this.rolePermissionRepository.bulkCreate(rolePermissions as any, { transaction });
      }

      await transaction.commit();
      return this.findOne(id, tenantId);
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(id: string, tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const role = await this.roleRepository.findOne({ where: { id }, transaction });
      if (!role) throw new NotFoundException(`Role dengan id ${id} tidak ditemukan`);
      await role.destroy({ transaction });
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
