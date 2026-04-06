const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:Theophilus2009%40123@db.zjystdpxlobcdukjxcii.supabase.co:5432/postgres'
});

client.connect()
  .then(() => client.query("UPDATE orders SET status = 'PENDING_ADMIN_REVIEW' WHERE status = 'pending'"))
  .then(res => console.log(`Updated ${res.rowCount} orders to PENDING_ADMIN_REVIEW`))
  .catch(e => console.error(e))
  .finally(() => client.end());
