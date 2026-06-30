import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  try {
    // Drop the old unique constraint on 'platform'
    await queryInterface.removeConstraint(
      { schema, tableName: 'platform_accounting_setting' },
      'platform_accounting_setting_platform_key'
    );
  } catch (error) {
    console.log(`Constraint platform_accounting_setting_platform_key not found in ${schema}, skipping...`);
  }

  try {
    // Add new composite unique constraint on platform and shop_id
    await queryInterface.addConstraint(
      { schema, tableName: 'platform_accounting_setting' },
      {
        fields: ['platform', 'shop_id'],
        type: 'unique',
        name: 'platform_accounting_setting_platform_shop_id_unique'
      }
    );
  } catch (error) {
    console.log(`Failed to add composite unique constraint in ${schema}:`, error.message);
  }
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  try {
    await queryInterface.removeConstraint(
      { schema, tableName: 'platform_accounting_setting' },
      'platform_accounting_setting_platform_shop_id_unique'
    );
  } catch (error) {
    console.log(`Constraint platform_accounting_setting_platform_shop_id_unique not found in ${schema}, skipping...`);
  }

  try {
    await queryInterface.addConstraint(
      { schema, tableName: 'platform_accounting_setting' },
      {
        fields: ['platform'],
        type: 'unique',
        name: 'platform_accounting_setting_platform_key'
      }
    );
  } catch (error) {
    console.log(`Failed to add unique constraint back in ${schema}:`, error.message);
  }
};
