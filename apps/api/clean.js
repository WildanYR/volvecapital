const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgres://postgres:123456@localhost:5432/volvecapital', { logging: false });

async function clean() {
  try {
    const schemas = await sequelize.query(`SELECT nspname AS id FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema' AND nspname != 'public' AND nspname != 'master'`, { type: Sequelize.QueryTypes.SELECT });
    for (const schema of schemas) {
      await sequelize.query(`DELETE FROM ${schema.id}.journal_entry WHERE source = 'SYSTEM_AMORTIZATION'`);
      console.log(`Deleted all SYSTEM_AMORTIZATION journals for tenant ${schema.id}`);
    }
    console.log('Clean completed successfully.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

clean();
