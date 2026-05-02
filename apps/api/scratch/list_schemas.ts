import { Sequelize } from 'sequelize';
import 'dotenv/config';

async function listSchemas() {
  const sequelize = new Sequelize(process.env.DATABASE_URL!, {
    dialect: 'postgres',
    logging: false,
  });

  try {
    const [results] = await sequelize.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'public', 'master')");
    console.log('Available Tenant Schemas:');
    console.log(results.map((r: any) => r.schema_name).join(', '));
  } catch (error) {
    console.error('Error fetching schemas:', error);
  } finally {
    await sequelize.close();
  }
}

listSchemas();
