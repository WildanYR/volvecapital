/**
 * Seed script untuk Role & Permission default
 *
 * Cara menjalankan:
 *   npx ts-node -r tsconfig-paths/register src/scripts/seed-role-permission.ts <tenant_id>
 *
 * Contoh:
 *   npx ts-node -r tsconfig-paths/register src/scripts/seed-role-permission.ts paytronik
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize-typescript';
import * as pg from 'pg';

const ALL_PERMISSIONS = [
  { name: 'dashboard.view', description: 'Melihat halaman dashboard utama' },
  { name: 'product.view', description: 'Melihat daftar produk' },
  { name: 'product.create', description: 'Membuat produk baru' },
  { name: 'product.edit', description: 'Mengedit produk' },
  { name: 'product.delete', description: 'Menghapus produk' },
  { name: 'user.view', description: 'Melihat daftar staff' },
  { name: 'user.create', description: 'Membuat akun staff baru' },
  { name: 'user.edit', description: 'Mengedit akun staff' },
  { name: 'user.delete', description: 'Menghapus akun staff' },
  { name: 'role.view', description: 'Melihat daftar role' },
  { name: 'role.create', description: 'Membuat role baru' },
  { name: 'role.edit', description: 'Mengedit role' },
  { name: 'role.delete', description: 'Menghapus role' },
  { name: 'transaction.view', description: 'Melihat daftar transaksi' },
  { name: 'transaction.create', description: 'Membuat transaksi' },
  { name: 'transaction.edit', description: 'Mengedit transaksi' },
  { name: 'transaction.delete', description: 'Menghapus transaksi' },
  { name: 'setting.view', description: 'Melihat pengaturan' },
  { name: 'setting.edit', description: 'Mengubah pengaturan' },
  { name: 'voucher.view', description: 'Melihat voucher' },
  { name: 'voucher.create', description: 'Membuat voucher' },
  { name: 'platform_product.view', description: 'Melihat produk dari platform' },
  { name: 'platform_product.edit', description: 'Mengelola produk dari platform' },
  { name: 'account.view', description: 'Melihat daftar akun' },
  { name: 'account.edit', description: 'Mengelola akun' },
  { name: 'account.delete', description: 'Menghapus akun' },
  { name: 'email.view', description: 'Melihat inbox dan log email' },
  { name: 'email.edit', description: 'Mengelola email forward dan subjek' },
  { name: 'email_message.view', description: 'Melihat system email message' },
  { name: 'wallet.view', description: 'Melihat saldo dan mutasi wallet' },
  { name: 'wallet.edit', description: 'Mengelola bank account (wallet)' },
  { name: 'content.view', description: 'Melihat daftar artikel dan tutorial' },
  { name: 'content.edit', description: 'Mengelola artikel dan tutorial' },
  { name: 'landing.view', description: 'Melihat pengaturan landing page CMS' },
  { name: 'landing.edit', description: 'Mengelola desain dan konten landing page' },
  { name: 'withdrawal.view', description: 'Melihat pengajuan penarikan dana' },
  { name: 'withdrawal.edit', description: 'Menyetujui atau menolak penarikan dana' },
  { name: 'device.view', description: 'Melihat daftar perangkat yang terkoneksi ke tenant' },
  { name: 'device.delete', description: 'Mengeluarkan perangkat dari akun (Force Logout)' },
];

const ROLE_PRESETS = [
  {
    name: 'Super Admin',
    description: 'Akses penuh ke semua fitur',
    permissions: ALL_PERMISSIONS.map(p => p.name),
  },
  {
    name: 'Admin',
    description: 'Akses ke semua fitur kecuali manajemen role',
    permissions: ALL_PERMISSIONS.filter(p => !p.name.startsWith('role.')).map(p => p.name),
  },
  {
    name: 'Staff CS',
    description: 'Akses dashboard dan transaksi',
    permissions: ['dashboard.view', 'transaction.view', 'transaction.create', 'voucher.view'],
  },
  {
    name: 'Viewer',
    description: 'Hanya bisa melihat data',
    permissions: ALL_PERMISSIONS.filter(p => p.name.endsWith('.view')).map(p => p.name),
  },
];

async function seed() {
  const tenantId = process.argv[2];
  if (!tenantId) {
    console.error('Usage: npx ts-node ... seed-role-permission.ts <tenant_id>');
    process.exit(1);
  }

  const sequelize = new Sequelize(process.env.DATABASE_URL!, {
    dialect: 'postgres',
    dialectModule: pg,
    logging: false,
  });

  const transaction = await sequelize.transaction();
  try {
    await sequelize.query(`SET LOCAL search_path TO "${tenantId}"`, { transaction });

    // Upsert permissions
    const permissionMap: Record<string, string> = {};
    for (const perm of ALL_PERMISSIONS) {
      const [result] = await sequelize.query(
        `INSERT INTO permissions (id, name, description, created_at, updated_at)
         VALUES (gen_random_uuid(), :name, :description, NOW(), NOW())
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
         RETURNING id, name`,
        { replacements: perm, transaction, type: 'SELECT' },
      );
      const row = result as any;
      permissionMap[row.name] = row.id;
    }

    // Create role presets
    for (const preset of ROLE_PRESETS) {
      const [existingRole] = await sequelize.query(
        `SELECT id FROM roles WHERE name = :name LIMIT 1`,
        { replacements: { name: preset.name }, transaction, type: 'SELECT' },
      );

      let roleId: string;
      if (existingRole) {
        roleId = (existingRole as any).id;
        console.log(`Role "${preset.name}" already exists, updating...`);
      }
      else {
        const [newRole] = await sequelize.query(
          `INSERT INTO roles (id, name, description, created_at, updated_at)
           VALUES (gen_random_uuid(), :name, :description, NOW(), NOW())
           RETURNING id`,
          { replacements: { name: preset.name, description: preset.description }, transaction, type: 'SELECT' },
        );
        roleId = (newRole as any).id;
        console.log(`Created role "${preset.name}"`);
      }

      // Clear existing permissions for this role
      await sequelize.query(
        `DELETE FROM role_permissions WHERE role_id = :roleId`,
        { replacements: { roleId }, transaction },
      );

      // Insert permissions
      for (const permName of preset.permissions) {
        const permId = permissionMap[permName];
        if (permId) {
          await sequelize.query(
            `INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
             VALUES (:roleId, :permId, NOW(), NOW())
             ON CONFLICT DO NOTHING`,
            { replacements: { roleId, permId }, transaction },
          );
        }
      }
    }

    await transaction.commit();
    console.log(`\n✅ Seed berhasil untuk tenant: ${tenantId}`);
    console.log(`   ${ALL_PERMISSIONS.length} permissions`);
    console.log(`   ${ROLE_PRESETS.length} roles`);
    process.exit(0);
  }
  catch (error) {
    await transaction.rollback();
    console.error('❌ Seed gagal:', error);
    process.exit(1);
  }
}

seed();
