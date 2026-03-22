/* eslint-disable no-console */
/* eslint-disable node/prefer-global/process */
require('ts-node/register');

const { migrateUp, migrateDown } = require('./migrations/migrator');

const commands = { up: migrateUp, down: migrateDown };

const cmd = process.argv[2];
if (!commands[cmd]) {
  console.error(
    `❌ Unknown command '${cmd}'. Options: ${Object.keys(commands).join(', ')}`,
  );
  process.exit(1);
}

commands[cmd]().finally(() => {
  console.log('✅ Done');
  process.exit(0);
});
