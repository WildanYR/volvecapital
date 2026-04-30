import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TENANT_REPOSITORY, TUTORIAL_REPOSITORY, TENANT_OWNER_REPOSITORY } from 'src/constants/database.const';
import { Tenant } from 'src/database/models/tenant.model';
import { TenantOwner } from 'src/database/models/tenant-owner.model';
import { Tutorial } from 'src/database/models/tutorial.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { MigrationProvider } from 'src/database/migration.provider';
import * as crypto from 'crypto';

@Injectable()
export class TenantProvisioningService {
  constructor(
    private readonly postgresProvider: PostgresProvider,
    private readonly migrationProvider: MigrationProvider,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepository: typeof Tenant,
    @Inject(TENANT_OWNER_REPOSITORY) private readonly tenantOwnerRepository: typeof TenantOwner,
    @Inject(TUTORIAL_REPOSITORY) private readonly tutorialRepository: typeof Tutorial,
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
        title: 'Selamat Datang di Volve Capital',
        slug: 'selamat-datang',
        subtitle: 'Ini adalah tutorial pertama Anda. Di sini Anda bisa mengelola voucher dan produk Anda.',
        is_published: true,
        steps: [],
      }, { transaction });

      await transaction.commit();
      return tenant;
    } catch (error: any) {
      await transaction.rollback();
      throw error;
    }
  }
}
