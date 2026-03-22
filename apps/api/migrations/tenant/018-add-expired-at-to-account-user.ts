import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes, QueryTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.addColumn({ tableName: 'account_user', schema }, 'expired_at', {
    type: DataTypes.DATE,
    allowNull: true,
  });

  const BATCH_SIZE = 5000;
  let totalUpdated = 0;

  while (true) {
    const [_results, metadata]: [any, any] = await queryInterface.sequelize.query(`
      UPDATE "${schema}"."account_user" AS au
      SET "expired_at" = a."batch_end_date"
      FROM "${schema}"."account" AS a
      WHERE au."account_id" = a."id"
      AND au."id" IN (
        SELECT "id" FROM "${schema}"."account_user"
        WHERE "expired_at" IS NULL
        LIMIT ${BATCH_SIZE}
      )
      AND a."batch_end_date" IS NOT NULL;
    `, { type: QueryTypes.UPDATE });

    const affectedRows = metadata.rowCount || 0;

    if (affectedRows === 0)
      break;

    totalUpdated += affectedRows;
    // eslint-disable-next-line no-console
    console.log(`[Migration] Updated ${totalUpdated} rows...`);

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "${schema}"."idx_account_user_expired_at_temp";`);
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.removeColumn({ tableName: 'account_user', schema }, 'expired_at');
};
