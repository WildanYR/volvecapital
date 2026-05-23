import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes, NOW } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  // 1. Create the table in the tenant schema
  await queryInterface.createTable(
    { tableName: 'email_subject', schema },
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      context: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      is_public: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
  );

  // 2. Attempt to copy existing data from master.email_subject
  try {
    // Check if master.email_subject exists before trying to copy
    const [results] = await queryInterface.sequelize.query(`
      SELECT to_regclass('master.email_subject');
    `);

    const tableExists = (results as any[])[0]?.to_regclass;

    if (tableExists) {
      // Check if is_public column exists in master
      const [columns] = await queryInterface.sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'master' AND table_name = 'email_subject' AND column_name = 'is_public';
      `);

      const hasIsPublic = (columns as any[]).length > 0;

      if (hasIsPublic) {
        await queryInterface.sequelize.query(`
          INSERT INTO "${schema}"."email_subject" (context, subject, is_public, created_at, updated_at)
          SELECT context, subject, is_public, created_at, updated_at FROM "master"."email_subject"
        `);
      } else {
        await queryInterface.sequelize.query(`
          INSERT INTO "${schema}"."email_subject" (context, subject, is_public, created_at, updated_at)
          SELECT context, subject, false, created_at, updated_at FROM "master"."email_subject"
        `);
      }
    }
  } catch (error) {
    console.error(`Failed to copy email_subject data to schema ${schema}:`, error);
    // Non-fatal, we continue
  }
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.dropTable({ tableName: 'email_subject', schema });
};
