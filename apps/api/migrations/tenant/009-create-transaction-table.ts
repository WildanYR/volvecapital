import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes, NOW } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.sequelize.transaction(async (tx) => {
    await queryInterface.createTable(
      { tableName: 'transaction', schema },
      {
        id: {
          primaryKey: true,
          allowNull: false,
          type: DataTypes.STRING,
        },
        customer: {
          allowNull: false,
          type: DataTypes.STRING,
        },
        platform: {
          allowNull: false,
          type: DataTypes.STRING,
        },
        total_price: {
          allowNull: false,
          type: DataTypes.INTEGER,
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
      { transaction: tx },
    );

    // 1) Index untuk filter rentang waktu (dipakai oleh semua agregasi)
    await queryInterface.addIndex(
      { tableName: 'transaction', schema },
      ['created_at'],
      {
        name: 'transactions_created_at_idx',
        using: 'BTREE',
        transaction: tx,
      },
    );

    // 2) Index untuk filter/agregasi per platform
    await queryInterface.addIndex(
      { tableName: 'transaction', schema },
      ['platform'],
      {
        name: 'transactions_platform_idx',
        using: 'BTREE',
        transaction: tx,
      },
    );

    // 3) Index komposit untuk query platform + rentang waktu
    //    (WHERE platform = ? AND created_at BETWEEN ? AND ?)
    await queryInterface.addIndex(
      { tableName: 'transaction', schema },
      ['platform', 'created_at'],
      {
        name: 'transactions_platform_created_at_idx',
        using: 'BTREE',
        transaction: tx,
      },
    );
  });
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.dropTable({ tableName: 'transaction', schema });
};
