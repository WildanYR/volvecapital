import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  const addColumnIfNotExists = async (tableName: string, columnName: string, options: any) => {
    try {
      const tableDesc = await queryInterface.describeTable({ schema, tableName });
      if (!tableDesc[columnName]) {
        await queryInterface.addColumn({ schema, tableName }, columnName, options);
      }
    } catch (err: any) {
      // Table might not exist or other error, just log and ignore if not fatal
      console.log(`Error describing/adding column ${columnName} to ${tableName}:`, err.message);
    }
  };

  // Check Accounting Period columns
  await addColumnIfNotExists('accounting_period', 'period_name', { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Period' });
  await addColumnIfNotExists('accounting_period', 'start_date', { type: DataTypes.DATEONLY, allowNull: false, defaultValue: new Date() });
  await addColumnIfNotExists('accounting_period', 'end_date', { type: DataTypes.DATEONLY, allowNull: false, defaultValue: new Date() });
  await addColumnIfNotExists('accounting_period', 'is_closed', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });

  // Check Journal Entry columns
  await addColumnIfNotExists('journal_entry', 'transaction_date', { type: DataTypes.DATEONLY, allowNull: false, defaultValue: new Date() });
  await addColumnIfNotExists('journal_entry', 'reference_number', { type: DataTypes.STRING(100), allowNull: true });
  await addColumnIfNotExists('journal_entry', 'description', { type: DataTypes.TEXT, allowNull: false, defaultValue: '' });
  await addColumnIfNotExists('journal_entry', 'status', { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'POSTED' });
  await addColumnIfNotExists('journal_entry', 'source', { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'MANUAL' });

  // Check Journal Line columns
  await addColumnIfNotExists('journal_line', 'memo', { type: DataTypes.STRING(255), allowNull: true });
  await addColumnIfNotExists('journal_line', 'debit', { type: DataTypes.DECIMAL(20, 2), allowNull: false, defaultValue: 0 });
  await addColumnIfNotExists('journal_line', 'credit', { type: DataTypes.DECIMAL(20, 2), allowNull: false, defaultValue: 0 });
  
  // ensure foreign keys if they are somehow missing
  await addColumnIfNotExists('journal_line', 'journal_entry_id', { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 });
  await addColumnIfNotExists('journal_line', 'coa_id', { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 });
};

export const down: MigrationFn<MigrationContext> = async () => {
  // No-op for down migration since this is a fix script
};
