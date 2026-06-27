const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgres://postgres:123456@localhost:5432/volvecapital', { logging: false });
sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_schema='paytronik' AND table_name='journal_entry'")
  .then(res => console.log(res[0].map(r => r.column_name)))
  .catch(console.error)
  .finally(() => process.exit(0));
