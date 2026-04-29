import { DataTypes, NOW } from 'sequelize';
import { MigrationFn } from 'umzug';
import { MigrationContext } from '../migrator';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema)) return;

  await queryInterface.createTable(
    { tableName: 'account_capital', schema },
    {
      id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.BIGINT,
      },
      account_id: {
        allowNull: false,
        type: DataTypes.BIGINT,
      },
      amount: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      note: {
        type: DataTypes.TEXT,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: NOW,
      },
    },
  );

  await queryInterface.addConstraint(
    { tableName: 'account_capital', schema },
    {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'fk_account_capital_account',
      references: {
        table: { tableName: 'account', schema },
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema)) return;

  await queryInterface.dropTable({ tableName: 'account_capital', schema });
};
