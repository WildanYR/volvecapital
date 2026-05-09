import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.dropTable({ tableName: 'account_modifier', schema });
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.createTable(
    { tableName: 'account_modifier', schema },
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      account_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'account', schema },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      modifier_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
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
    },
  );

  await queryInterface.addIndex(
    { tableName: 'account_modifier', schema },
    ['account_id', 'modifier_id'],
    {
      unique: true,
      name: `account_modifier_${schema}_account_id_modifier_id_key`,
    },
  );
};
