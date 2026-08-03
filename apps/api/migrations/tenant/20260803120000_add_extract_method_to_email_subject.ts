import { DataTypes } from 'sequelize';
import type { MigrationContext } from '../migrator';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  const table = { tableName: 'email_subject', schema };

  const tableInfo = await queryInterface.describeTable(table);
  if (!tableInfo['extract_method']) {
    await queryInterface.addColumn(table, 'extract_method', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }
}

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  const table = { tableName: 'email_subject', schema };
  
  const tableInfo = await queryInterface.describeTable(table);
  if (tableInfo['extract_method']) {
    await queryInterface.removeColumn(table, 'extract_method');
  }
}
