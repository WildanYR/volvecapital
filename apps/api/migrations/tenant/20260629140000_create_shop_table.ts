import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  // 1. Create shop table
  await queryInterface.createTable(
    { schema, tableName: 'shop' },
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      platform: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    }
  );

  // 2. Add shop_id to transaction
  await queryInterface.addColumn(
    { schema, tableName: 'transaction' },
    'shop_id',
    {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: { tableName: 'shop', schema },
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
  );

  // 3. Add shop_id to platform_product
  await queryInterface.addColumn(
    { schema, tableName: 'platform_product' },
    'shop_id',
    {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: { tableName: 'shop', schema },
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  await queryInterface.removeColumn({ schema, tableName: 'platform_product' }, 'shop_id');
  await queryInterface.removeColumn({ schema, tableName: 'transaction' }, 'shop_id');
  await queryInterface.dropTable({ schema, tableName: 'shop' });
};
