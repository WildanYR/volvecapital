import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.sequelize.query(
    `CREATE OR REPLACE FUNCTION "${schema}"."touch_updated_at"()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at := CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;`,
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.sequelize.query(
    `DROP FUNCTION IF EXISTS "${schema}"."touch_updated_at"();`,
  );
};
