const { Sequelize, Op } = require('sequelize');

async function run() {
  const sequelize = new Sequelize('postgres://postgres:123456@localhost:5432/volvecapital');
  const [results] = await sequelize.query(`
    SELECT t.id, t.tenant_id, t.subject_id, t.context, t.status, t.execute_at, a.email_id, e.email
    FROM master.task_queue t
    JOIN paytronik.account a ON a.id = t.subject_id
    JOIN paytronik.email e ON e.id = a.email_id
    WHERE t.context = 'NETFLIX_RESET_PASSWORD' 
    AND t.status IN ('QUEUED', 'DISPATCHED') 
    AND e.email IN ('istilahkata883@gmail.com', 'ajikamala4@gmail.com', 'ALUNapremium.70@gmail.com')
  `);
  
  if (results.length === 0) {
    console.log("Antrian task reset kosong untuk akun tersebut.");
  } else {
    console.table(results);
  }
  process.exit(0);
}

run();
