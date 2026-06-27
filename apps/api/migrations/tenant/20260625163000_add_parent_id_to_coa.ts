import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  try {
    // Add parent_id column to coa
    await queryInterface.addColumn(
      { schema, tableName: 'coa' },
      'parent_id',
      {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: { tableName: 'coa', schema },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }
    );
  } catch (err: any) {
    console.log(`Column parent_id might already exist:`, err.message);
  }
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  await queryInterface.removeColumn(
    { schema, tableName: 'coa' },
    'parent_id'
  );
};
