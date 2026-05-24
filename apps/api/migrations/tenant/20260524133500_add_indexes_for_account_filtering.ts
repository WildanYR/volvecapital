import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.sequelize.transaction(async (tx) => {
    // 1) Indexes for the account table
    await queryInterface.addIndex(
      { tableName: 'account', schema },
      ['product_variant_id'],
      {
        name: 'account_product_variant_id_idx',
        using: 'BTREE',
        transaction: tx,
      },
    );

    await queryInterface.addIndex(
      { tableName: 'account', schema },
      ['email_id'],
      {
        name: 'account_email_id_idx',
        using: 'BTREE',
        transaction: tx,
      },
    );

    await queryInterface.addIndex(
      { tableName: 'account', schema },
      ['status'],
      {
        name: 'account_status_idx',
        using: 'BTREE',
        transaction: tx,
      },
    );

    // 2) Index for the account_profile table
    await queryInterface.addIndex(
      { tableName: 'account_profile', schema },
      ['account_id'],
      {
        name: 'account_profile_account_id_idx',
        using: 'BTREE',
        transaction: tx,
      },
    );

    // 3) Indexes for the account_user table
    await queryInterface.addIndex(
      { tableName: 'account_user', schema },
      ['account_id'],
      {
        name: 'account_user_account_id_idx',
        using: 'BTREE',
        transaction: tx,
      },
    );

    await queryInterface.addIndex(
      { tableName: 'account_user', schema },
      ['account_profile_id', 'status'],
      {
        name: 'account_user_profile_status_idx',
        using: 'BTREE',
        transaction: tx,
      },
    );
  });
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.sequelize.transaction(async (tx) => {
    await queryInterface.removeIndex(
      { tableName: 'account', schema },
      'account_product_variant_id_idx',
      { transaction: tx },
    );

    await queryInterface.removeIndex(
      { tableName: 'account', schema },
      'account_email_id_idx',
      { transaction: tx },
    );

    await queryInterface.removeIndex(
      { tableName: 'account', schema },
      'account_status_idx',
      { transaction: tx },
    );

    await queryInterface.removeIndex(
      { tableName: 'account_profile', schema },
      'account_profile_account_id_idx',
      { transaction: tx },
    );

    await queryInterface.removeIndex(
      { tableName: 'account_user', schema },
      'account_user_account_id_idx',
      { transaction: tx },
    );

    await queryInterface.removeIndex(
      { tableName: 'account_user', schema },
      'account_user_profile_status_idx',
      { transaction: tx },
    );
  });
};
