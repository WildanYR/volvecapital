import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { ALL_PERMISSIONS } from '../../src/constants/permissions.const';
import { v4 as uuidv4 } from 'uuid';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema)) {
    return;
  }

  // 1. Dapatkan role Super Admin (jika ada) untuk di-assign permission baru secara otomatis
  const [roles] = await queryInterface.sequelize.query(
    `SELECT id, name FROM "${schema}"."roles" WHERE name = 'Super Admin' LIMIT 1`
  ) as any[];
  const superAdminRole = roles.length > 0 ? roles[0] : null;

  // 2. Dapatkan permission yang sudah ada
  const [existingPerms] = await queryInterface.sequelize.query(
    `SELECT id, name FROM "${schema}"."permissions"`
  ) as any[];
  
  const existingNames = new Set(existingPerms.map((p: any) => p.name));

  // 3. Filter permission yang belum ada
  const newPerms = ALL_PERMISSIONS.filter(p => !existingNames.has(p.name));

  if (newPerms.length === 0) {
    console.log(`[${schema}] Semua permission sudah lengkap, tidak ada yang di-seed.`);
    return;
  }

  console.log(`[${schema}] Menambahkan ${newPerms.length} permission baru...`);

  const now = new Date();
  
  // Karena ID permission menggunakan UUID atau BIGINT auto increment?
  // Mari kita cek struktur tabel permissions. Di database ini biasanya auto increment (BIGINT).
  // Tapi bulkInsert butuh createdAt updatedAt
  const recordsToInsert = newPerms.map(p => ({
    name: p.name,
    description: p.description,
    created_at: now,
    updated_at: now,
  }));

  // Insert dan dapatkan hasil kembalian (id)
  // Untuk PostgreSQL, kita bisa query RETURNING id
  const insertQuery = `
    INSERT INTO "${schema}"."permissions" (name, description, created_at, updated_at)
    VALUES ${recordsToInsert.map(p => `('${p.name}', '${p.description}', '${now.toISOString()}', '${now.toISOString()}')`).join(', ')}
    RETURNING id, name;
  `;

  const [insertedPerms] = await queryInterface.sequelize.query(insertQuery) as any[];

  // 4. Assign permission baru ke Super Admin
  if (superAdminRole && insertedPerms.length > 0) {
    const rolePermsToInsert = insertedPerms.map((p: any) => ({
      role_id: superAdminRole.id,
      permission_id: p.id,
      created_at: now,
      updated_at: now,
    }));

    const rolePermsValues = rolePermsToInsert.map(rp => `('${rp.role_id}', '${rp.permission_id}', '${now.toISOString()}', '${now.toISOString()}')`).join(', ');
    
    const insertRolePermsQuery = `
      INSERT INTO "${schema}"."role_permissions" (role_id, permission_id, created_at, updated_at)
      VALUES ${rolePermsValues};
    `;
    await queryInterface.sequelize.query(insertRolePermsQuery);
    console.log(`[${schema}] Berhasil memberikan akses permission baru ke Super Admin.`);
  }
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  // Tidak perlu down migration untuk seeding permission agar aman
};
