import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  // Jangan jalankan migration ini di schema publik/master
  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  // 1. Tabel Chart of Accounts (COA)
  await queryInterface.createTable(
    { schema, tableName: 'coa' },
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(30), // ASET, KEWAJIBAN, MODAL, PENDAPATAN, HPP, BEBAN
        allowNull: false,
      },
      normal_balance: {
        type: DataTypes.STRING(10), // DEBIT, KREDIT
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      parent_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: { tableName: 'coa', schema },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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

  await queryInterface.addIndex({ schema, tableName: 'coa' }, ['code'], {
    unique: true,
    name: `idx_coa_code_${schema}`,
  });

  // 2. Tabel Periode Akuntansi
  await queryInterface.createTable(
    { schema, tableName: 'accounting_period' },
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      period_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      is_closed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

  // 3. Tabel Journal Entry (Header)
  await queryInterface.createTable(
    { schema, tableName: 'journal_entry' },
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      transaction_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      reference_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(20), // DRAFT, POSTED, VOID
        allowNull: false,
        defaultValue: 'POSTED',
      },
      source: {
        type: DataTypes.STRING(50), // AUTO_LANDING, AUTO_SHOPEE, MANUAL, ADJUSTMENT, CLOSING
        allowNull: false,
        defaultValue: 'MANUAL',
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

  // 4. Tabel Journal Line (Detail)
  await queryInterface.createTable(
    { schema, tableName: 'journal_line' },
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      journal_entry_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: { tableName: 'journal_entry', schema },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      coa_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: { tableName: 'coa', schema },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      debit: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
      },
      credit: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
      },
      memo: {
        type: DataTypes.STRING(255),
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
    }
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  await queryInterface.dropTable({ schema, tableName: 'journal_line' });
  await queryInterface.dropTable({ schema, tableName: 'journal_entry' });
  await queryInterface.dropTable({ schema, tableName: 'accounting_period' });
  await queryInterface.dropTable({ schema, tableName: 'coa' });
};
