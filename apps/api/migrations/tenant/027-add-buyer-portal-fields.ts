import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface } = context;

  // 1. Add is_public to master.email_subject
  await queryInterface.addColumn(
    { schema: 'master', tableName: 'email_subject' },
    'is_public',
    {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    }
  );

  // 2. Add fields to tenant schemas
  const schemas = (await queryInterface.showAllSchemas()) as string[];
  for (const schema of schemas) {
    if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema)) continue;

    // Add access fields to voucher table
    await queryInterface.addColumn(
      { schema, tableName: 'voucher' },
      'access_token',
      {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      }
    );

    await queryInterface.addColumn(
      { schema, tableName: 'voucher' },
      'access_count_today',
      {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      }
    );

    await queryInterface.addColumn(
      { schema, tableName: 'voucher' },
      'last_access_at',
      {
        type: DataTypes.DATE,
        allowNull: true,
      }
    );
  }
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
