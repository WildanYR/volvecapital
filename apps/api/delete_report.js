const dotenv = require('dotenv');
const { Sequelize } = require('sequelize');

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, { dialect: 'postgres' });
sequelize.query('DELETE FROM master.permission WHERE name=\'report.view\';')
  .then(() => console.log('Deleted report.view'))
  .catch(console.error)
  .finally(() => process.exit(0));
