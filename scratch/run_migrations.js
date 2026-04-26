const path = require('path');
require('ts-node/register');
require('tsconfig-paths/register');
const { migrateUp } = require(path.resolve(__dirname, '../apps/api/migrations/migrator.ts'));

migrateUp().then(() => {
  console.log('Migration finished');
  process.exit(0);
}).catch(err => {
  console.error('Migration failed', err);
  process.exit(1);
});
