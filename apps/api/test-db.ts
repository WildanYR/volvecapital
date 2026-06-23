import { Sequelize } from 'sequelize-typescript';

const sequelize = new Sequelize('postgres://postgres:123456@localhost:5432/volvecapital', {
  logging: false
});

async function run() {
  try {
    const schemas: any = await sequelize.query("SELECT schema_name FROM information_schema.schemata");
    console.log("Schemas:", schemas[0].map((s: any) => s.schema_name).filter((n: string) => n.includes('tenant')));
    const tables: any = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log("Public Tables:", tables[0].map((t: any) => t.table_name));
    
    // Find where manual_book is
    const manual_books_query: any = await sequelize.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%manual%'");
    console.log("Manual Book tables:", manual_books_query[0]);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
