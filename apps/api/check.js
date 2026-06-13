const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgres://postgres:123456@localhost:5432/volvecapital', { dialect: 'postgres', logging: false });

async function check() {
  const labels = await sequelize.query(`SELECT * FROM "paytronik"."label"`, { type: Sequelize.QueryTypes.SELECT });
  console.log('Labels in paytronik:', labels);
  
  const labels2 = await sequelize.query(`SELECT * FROM "capital"."label"`, { type: Sequelize.QueryTypes.SELECT });
  console.log('Labels in capital:', labels2);
  
  const labels3 = await sequelize.query(`SELECT * FROM "rojolapak"."label"`, { type: Sequelize.QueryTypes.SELECT });
  console.log('Labels in rojolapak:', labels3);
}

check().then(() => process.exit(0)).catch(console.error);
