const { Sequelize, QueryTypes } = require('sequelize');
const sequelize = new Sequelize('postgres://postgres:123456@localhost:5432/volvecapital', { logging: false });
sequelize.query("SELECT reference FROM paytronik.journal_entry WHERE source = 'SYSTEM_AMORTIZATION'", { type: QueryTypes.SELECT })
  .then(console.log)
  .catch(console.error)
  .finally(() => process.exit(0));
