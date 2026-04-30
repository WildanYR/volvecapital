import { migrateUp } from './migrator';

migrateUp().then(() => {
  console.log('Migration process finished');
  process.exit(0);
}).catch((err) => {
  console.error('Migration failed', err);
  process.exit(1);
});
