const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

async function check() {
  try {
    const [results] = await sequelize.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'landing_page_settings'
    `);
    console.log('Found tables:', results);
  } catch (err) {
    console.error('Error checking tables:', err);
  } finally {
    await sequelize.close();
  }
}

check();
