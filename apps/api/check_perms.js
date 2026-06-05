const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, { dialect: 'postgres' });
sequelize.query("SELECT * FROM master.permissions").then(res => {
  console.log(res[0]);
  process.exit(0);
});
