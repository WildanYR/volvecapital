import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface } = context;

  // 1. Add is_public to master.email_subject (Try-catch to prevent error on re-run during tenant loop)
  try {
    await queryInterface.addColumn(
      { schema: 'master', tableName: 'email_subject' },
      'is_public',
      {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }
    );
  } catch (err) {
    // Already exists or other error we skip
  }

  // 2. Add fields to current tenant schema
  const { schema } = context;
  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema)) return;

  // Add access fields to voucher table
  try {
    await queryInterface.addColumn(
      { schema, tableName: 'voucher' },
      'access_token',
      {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      }
    );
  } catch (err) {}

  try {
    await queryInterface.addColumn(
      { schema, tableName: 'voucher' },
      'access_count_today',
      {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      }
    );
  } catch (err) {}

  try {
    await queryInterface.addColumn(
      { schema, tableName: 'voucher' },
      'last_access_at',
      {
        type: DataTypes.DATE,
        allowNull: true,
      }
    );
  } catch (err) {}
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface } = context;

  await queryInterface.removeColumn({ schema: 'master', tableName: 'email_subject' }, 'is_public');

  const schemas = (await queryInterface.showAllSchemas()) as string[];
  for (const schema of schemas) {
    if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema)) continue;
    await queryInterface.removeColumn({ schema, tableName: 'voucher' }, 'access_token');
    await queryInterface.removeColumn({ schema, tableName: 'voucher' }, 'access_count_today');
    await queryInterface.removeColumn({ schema, tableName: 'voucher' }, 'last_access_at');
  }
};
