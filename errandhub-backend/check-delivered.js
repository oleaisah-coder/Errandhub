const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:Theophilus2009%40123@db.zjystdpxlobcdukjxcii.supabase.co:5432/postgres'
});

client.connect()
  .then(() => client.query("SELECT COUNT(*) FROM orders WHERE status = 'delivered'"))
  .then(res => console.log(`Delivered orders: ${res.rows[0].count}`))
  .catch(e => console.error(e))
  .finally(() => client.end());
