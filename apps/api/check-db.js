const { Client } = require('pg'); 
const client = new Client('postgres://postgres:123456@localhost:5432/volvecapital'); 
client.connect().then(() => 
    client.query("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'task_queue'")
).then(res => { 
    console.table(res.rows); 
    client.end(); 
}).catch(console.error);
