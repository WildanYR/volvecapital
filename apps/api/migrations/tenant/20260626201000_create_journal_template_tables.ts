import { DataTypes } from 'sequelize';
import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.createTable({ tableName: 'journal_template', schema }, {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    tenant_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  await queryInterface.createTable({ tableName: 'journal_template_item', schema }, {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    journal_template_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: { tableName: 'journal_template', schema },
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    coa_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: { tableName: 'coa', schema },
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    position: {
      type: DataTypes.ENUM('DEBIT', 'CREDIT'),
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
  });
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.dropTable({ tableName: 'journal_template_item', schema });
  await queryInterface.dropTable({ tableName: 'journal_template', schema });
  
  await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${schema}"."enum_journal_template_item_position";`);
};
