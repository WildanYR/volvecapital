import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  
  await queryInterface.sequelize.transaction(async (tx) => {
    await queryInterface.sequelize.query(
      `ALTER TABLE "${schema}"."transaction" ADD COLUMN IF NOT EXISTS "mdr_fee" INTEGER NOT NULL DEFAULT 0;`,
      { transaction: tx }
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "${schema}"."transaction" ADD COLUMN IF NOT EXISTS "platform_fee" INTEGER NOT NULL DEFAULT 0;`,
      { transaction: tx }
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "${schema}"."transaction" ADD COLUMN IF NOT EXISTS "net_profit" INTEGER NOT NULL DEFAULT 0;`,
      { transaction: tx }
    );
  });
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  
  await queryInterface.sequelize.transaction(async (tx) => {
    await queryInterface.sequelize.query(
      `ALTER TABLE "${schema}"."transaction" DROP COLUMN IF EXISTS "mdr_fee";`,
      { transaction: tx }
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "${schema}"."transaction" DROP COLUMN IF EXISTS "platform_fee";`,
      { transaction: tx }
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "${schema}"."transaction" DROP COLUMN IF EXISTS "net_profit";`,
      { transaction: tx }
    );
  });
};
