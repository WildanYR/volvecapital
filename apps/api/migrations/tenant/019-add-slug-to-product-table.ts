import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.addColumn(
    { tableName: 'product', schema },
    'slug',
    {
      type: DataTypes.STRING,
      allowNull: true,
    },
  );

  // Populate slug from name: lowercase and replace non-alphanumeric with dash
  // Then trim leading/trailing dashes
  await queryInterface.sequelize.query(
    `UPDATE "${schema}"."product" 
     SET "slug" = TRIM(BOTH '-' FROM LOWER(REGEXP_REPLACE("name", '[^a-zA-Z0-9]+', '-', 'g'))) 
     WHERE "slug" IS NULL`,
  );

  // Add unique constraint after population to avoid conflicts if names are same
  await queryInterface.addConstraint({ tableName: 'product', schema }, {
    fields: ['slug'],
    type: 'unique',
    name: `product_slug_${schema}_unique`,
  });
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.removeColumn({ tableName: 'product', schema }, 'slug');
};
