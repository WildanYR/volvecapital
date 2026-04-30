import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes, NOW } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  // 1. Update Tabel 'tenant'
  await queryInterface.addColumn({ tableName: 'tenant', schema }, 'status', {
    type: DataTypes.ENUM('active', 'pending', 'suspended'),
    defaultValue: 'pending',
    allowNull: false,
  });

  await queryInterface.addColumn({ tableName: 'tenant', schema }, 'name', {
    type: DataTypes.STRING,
    allowNull: true, // Bisa diisi nanti atau default ke ID
  });

  // Hapus kolom secret karena akan menggunakan password di tenant_owner
  await queryInterface.removeColumn({ tableName: 'tenant', schema }, 'secret');

  // 2. Buat Tabel 'tenant_owner'
  await queryInterface.createTable(
    { tableName: 'tenant_owner', schema },
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      tenant_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: { tableName: 'tenant', schema },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
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
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.dropTable({ tableName: 'tenant_owner', schema });
  
  await queryInterface.removeColumn({ tableName: 'tenant', schema }, 'status');
  await queryInterface.removeColumn({ tableName: 'tenant', schema }, 'name');
  await queryInterface.addColumn({ tableName: 'tenant', schema }, 'secret', {
    type: DataTypes.STRING,
    allowNull: true,
  });
};
