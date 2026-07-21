import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  try {
    const tableDesc = await queryInterface.describeTable({ schema, tableName: 'journal_entry' });
    
    if (tableDesc['date'] && tableDesc['transaction_date']) {
      await queryInterface.sequelize.query(`
        UPDATE "${schema}"."journal_entry"
        SET transaction_date = "date"
        WHERE "date" IS NOT NULL;
      `);
      await queryInterface.removeColumn({ schema, tableName: 'journal_entry' }, 'date');
    }

    if (tableDesc['reference'] && tableDesc['reference_number']) {
      await queryInterface.sequelize.query(`
        UPDATE "${schema}"."journal_entry"
        SET reference_number = "reference"
        WHERE "reference" IS NOT NULL;
      `);
      await queryInterface.removeColumn({ schema, tableName: 'journal_entry' }, 'reference');
    }
  } catch (err: any) {
    console.log(`Error migrating legacy columns in ${schema}:`, err.message);
  }
};

export const down: MigrationFn<MigrationContext> = async () => {
  // No-op
};
