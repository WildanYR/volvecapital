const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgres://postgres:123456@localhost:5432/volvecapital', { logging: false });
sequelize.query("INSERT INTO paytronik.journal_entry (id, date, reference, description, source, status, created_at, updated_at) VALUES ('12345', '2026-06-26', 'AMRT-REV-70026-2026-06-26', 'test', 'SYSTEM_AMORTIZATION', 'POSTED', NOW(), NOW())")
  .then(() => sequelize.query("SELECT reference FROM paytronik.journal_entry WHERE reference LIKE 'AMRT-%-2026-06-26'", { type: 'SELECT' }))
  .then(console.log)
  .then(() => sequelize.query("DELETE FROM paytronik.journal_entry WHERE source = 'SYSTEM_AMORTIZATION'"))
  .catch(console.error)
  .finally(() => process.exit(0));
