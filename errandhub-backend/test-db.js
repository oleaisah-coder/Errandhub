const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:Theophilus2009%40123@db.zjystdpxlobcdukjxcii.supabase.co:5432/postgres'
});

client.connect()
  .then(() => client.query("SELECT id, email, role FROM users"))
  .then(res => console.log(res.rows))
  .catch(e => console.error(e))
  .finally(() => client.end());
