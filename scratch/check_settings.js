const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgres://postgres:postgres@localhost:5432/volve', { logging: false });
sequelize.query("SELECT * FROM papapremium.tenant_setting").then(res => {
  console.log(res[0]);
  process.exit(0);
}).catch(console.error);
