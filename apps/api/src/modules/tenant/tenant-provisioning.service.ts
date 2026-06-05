import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TENANT_REPOSITORY, TUTORIAL_REPOSITORY, TENANT_OWNER_REPOSITORY } from 'src/constants/database.const';
import { Tenant } from 'src/database/models/tenant.model';
import { TenantOwner } from 'src/database/models/tenant-owner.model';
import { Tutorial } from 'src/database/models/tutorial.model';
import { Permission } from 'src/database/models/permission.model';
import { Role } from 'src/database/models/role.model';
import { RolePermission } from 'src/database/models/role-permission.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { MigrationProvider } from 'src/database/migration.provider';
import { ALL_PERMISSIONS, ROLE_PRESETS } from 'src/constants/permissions.const';
import * as crypto from 'crypto';

@Injectable()
export class TenantProvisioningService {
  constructor(
    private readonly postgresProvider: PostgresProvider,
    private readonly migrationProvider: MigrationProvider,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepository: typeof Tenant,
    @Inject(TENANT_OWNER_REPOSITORY) private readonly tenantOwnerRepository: typeof TenantOwner,
    @Inject(TUTORIAL_REPOSITORY) private readonly tutorialRepository: typeof Tutorial,
    @Inject('PERMISSION_REPOSITORY') private readonly permissionRepository: typeof Permission,
    @Inject('ROLE_REPOSITORY') private readonly roleRepository: typeof Role,
    @Inject('ROLE_PERMISSION_REPOSITORY') private readonly rolePermissionRepository: typeof RolePermission,
  ) {}

  async provision(data: {
    username: string;
    email: string;
    password: string;
    name?: string;
  }) {
    const { username, email, password, name } = data;
    const schema = username.toLowerCase().replace(/[^a-z0-9]/g, '');

    const existingTenant = await this.tenantRepository.findByPk(schema);
    if (existingTenant) {
      throw new BadRequestException(`Username "${username}" sudah digunakan, silakan pilih nama lain.`);
    }

    const existingOwner = await this.tenantOwnerRepository.findOne({ where: { email } });
    if (existingOwner) {
      throw new BadRequestException(`Email "${email}" sudah terdaftar, silakan gunakan email lain.`);
    }

    const transaction = await this.postgresProvider.transaction();
    try {
      // 1. Create Tenant Record in Master
      await this.postgresProvider.setSchema('master', transaction);
      
      const tenant = await this.tenantRepository.create({
        id: schema,
        name: name || username,
        status: 'active', // Set to active for now, change to pending if verification is implemented
      }, { transaction });

      // Hash password (simple sha256 for now, can be improved)
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

      await this.tenantOwnerRepository.create({
        tenant_id: tenant.id,
        email,
        password: hashedPassword,
        is_verified: true, // Auto verify for now
      }, { transaction });

      // 2. Create Schema
      await this.migrationProvider.createSchema(schema);

      // 3. Run Migrations
      await this.migrationProvider.migrateTenant(schema);

      // 4. Insert Sample Data
      await this.postgresProvider.setSchema(schema, transaction);
      await this.tutorialRepository.create({
        title: 'Selamat Datang di Digital Premium',
        slug: 'selamat-datang',
        subtitle: 'Ini adalah tutorial pertama Anda. Di sini Anda bisa mengelola voucher dan produk Anda.',
        is_published: true,
        steps: [],
      }, { transaction });

      // 5. Insert Role and Permissions
      const permissions = await this.permissionRepository.bulkCreate(ALL_PERMISSIONS, { transaction });
      
      const permissionMap: Record<string, string> = {};
      for (const p of permissions) {
        permissionMap[p.name] = p.id;
      }

      for (const preset of ROLE_PRESETS) {
        const role = await this.roleRepository.create({
          name: preset.name,
          description: preset.description,
        }, { transaction });

        const rolePermissions = preset.permissions.map(pName => ({
          role_id: role.id,
          permission_id: permissionMap[pName],
        }));

        await this.rolePermissionRepository.bulkCreate(rolePermissions, { transaction });
      }

      await transaction.commit();
      return tenant;
    } catch (error: any) {
      await transaction.rollback();
      throw error;
    }
  }
}
