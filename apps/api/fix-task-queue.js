const { Client } = require('pg');

async function fixDb() {
    const client = new Client('postgres://postgres:123456@localhost:5432/volvecapital');
    await client.connect();

    try {
        const res = await client.query(`
            SELECT table_schema 
            FROM information_schema.tables 
            WHERE table_name = 'task_queue'
        `);

        for (const row of res.rows) {
            const schema = row.table_schema;
            console.log(`Fixing task_queue in schema: ${schema}`);
            
            await client.query(`ALTER TABLE "${schema}"."task_queue" ALTER COLUMN payload TYPE TEXT;`);
            await client.query(`ALTER TABLE "${schema}"."task_queue" ALTER COLUMN error_message TYPE TEXT;`);
            
            console.log(`Successfully updated payload & error_message to TEXT in ${schema}`);
        }
    } catch (err) {
        console.error('Error fixing DB:', err);
    } finally {
        await client.end();
    }
}

fixDb();
