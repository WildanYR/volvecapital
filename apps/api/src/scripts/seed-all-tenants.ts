import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize-typescript';
import * as pg from 'pg';
import { ALL_PERMISSIONS, ROLE_PRESETS } from '../constants/permissions.const';

async function seedAll() {
  const sequelize = new Sequelize(process.env.DATABASE_URL!, {
    dialect: 'postgres',
    dialectModule: pg,
    logging: false,
  });

  try {
    const [schemas] = await sequelize.query(`SELECT nspname AS id FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema' AND nspname != 'public'`);
    
    for (const tenantRow of schemas) {
      const tenantId = (tenantRow as any).id;
      console.log(`\nSeeding permissions for tenant: ${tenantId}...`);
      
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
          }
          else {
            const [newRole] = await sequelize.query(
              `INSERT INTO roles (id, name, description, created_at, updated_at)
               VALUES (gen_random_uuid(), :name, :description, NOW(), NOW())
               RETURNING id`,
              { replacements: { name: preset.name, description: preset.description }, transaction, type: 'SELECT' },
            );
            roleId = (newRole as any).id;
          }

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
        console.log(`✅ Seed berhasil untuk tenant: ${tenantId}`);
      } catch (error) {
        await transaction.rollback();
        console.error(`❌ Seed gagal untuk tenant ${tenantId}:`, error);
      }
    }
    process.exit(0);
  } catch (error) {
    console.error('Failed to get tenants:', error);
    process.exit(1);
  }
}

seedAll();
