import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize-typescript';
import * as pg from 'pg';

async function migrate() {
  const sequelize = new Sequelize(process.env.DATABASE_URL!, {
    dialect: 'postgres',
    dialectModule: pg,
    logging: false,
  });

  try {
    const [schemas] = await sequelize.query(`SELECT nspname AS id FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema' AND nspname != 'public'`);
    
    for (const tenantRow of schemas) {
      const tenantId = (tenantRow as any).id;
      console.log(`\nMigrating categories for tenant: ${tenantId}...`);
      
      const transaction = await sequelize.transaction();
      try {
        await sequelize.query(`SET LOCAL search_path TO "${tenantId}"`, { transaction });

        // Add parent_id column if it doesn't exist
        await sequelize.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = '${tenantId}' 
              AND table_name = 'manual_book_category' 
              AND column_name = 'parent_id'
            ) THEN
              ALTER TABLE "${tenantId}".manual_book_category 
              ADD COLUMN parent_id UUID REFERENCES "${tenantId}".manual_book_category(id) ON DELETE CASCADE;
            END IF;
          END $$;
        `, { transaction });

        await transaction.commit();
        console.log(`✅ Migration berhasil untuk tenant: ${tenantId}`);
      } catch (error) {
        await transaction.rollback();
        console.error(`❌ Migration gagal untuk tenant ${tenantId}:`, error);
      }
    }
    process.exit(0);
  } catch (error) {
    console.error('Failed to get tenants:', error);
    process.exit(1);
  }
}

migrate();
