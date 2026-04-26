import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface } = context;

  const schemas = (await queryInterface.showAllSchemas()) as string[];
  for (const schema of schemas) {
    if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema)) continue;

    await queryInterface.addColumn(
      { schema, tableName: 'email_message' },
      'recipient_email',
      {
        type: DataTypes.STRING,
        allowNull: true,
      }
    );
  }
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface } = context;

  const schemas = (await queryInterface.showAllSchemas()) as string[];
  for (const schema of schemas) {
    if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema)) continue;
    await queryInterface.removeColumn({ schema, tableName: 'email_message' }, 'recipient_email');
  }
};
