const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:Theophilus2009%40123@db.zjystdpxlobcdukjxcii.supabase.co:5432/postgres'
});

client.connect()
  .then(() => client.query("SELECT COUNT(*) FROM runners"))
  .then(res => console.log(`Runners in DB: ${res.rows[0].count}`))
  .catch(e => console.error(e))
  .finally(() => client.end());
