const { Sequelize } = require('sequelize');
const { execSync } = require('child_process');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {logging: false});

sequelize.query('SELECT schema_name FROM information_schema.schemata').then(([res]) => {
  const schemas = res.map(r => r.schema_name).filter(s => !['public', 'information_schema', 'pg_catalog', 'pg_toast'].includes(s) && !s.startsWith('pg_'));
  for (const schema of schemas) {
    if (schema === 'master') continue;
    console.log('Seeding schema: ' + schema);
    try {
      execSync('npx ts-node src/scripts/seed-role-permission.ts ' + schema, { stdio: 'inherit' });
    } catch (e) {
      console.error('Failed to seed ' + schema);
    }
  }
  process.exit(0);
});
