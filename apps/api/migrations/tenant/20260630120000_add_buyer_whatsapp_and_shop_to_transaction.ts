import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  // Do not run this in public/master schemas
  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  try {
    await queryInterface.addColumn(
      { schema, tableName: 'transaction' },
      'buyer_whatsapp',
      {
        type: DataTypes.STRING,
        allowNull: true,
      }
    );
  } catch (err: any) {
    console.log(`Column buyer_whatsapp might already exist in ${schema}:`, err.message);
  }

  try {
    await queryInterface.addColumn(
      { schema, tableName: 'transaction' },
      'shop_id',
      {
        type: DataTypes.BIGINT,
        allowNull: true,
      }
    );
  } catch (err: any) {
    console.log(`Column shop_id might already exist in ${schema}:`, err.message);
  }
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  try {
    await queryInterface.removeColumn({ schema, tableName: 'transaction' }, 'buyer_whatsapp');
  } catch (err: any) {}

  try {
    await queryInterface.removeColumn({ schema, tableName: 'transaction' }, 'shop_id');
  } catch (err: any) {}
};
