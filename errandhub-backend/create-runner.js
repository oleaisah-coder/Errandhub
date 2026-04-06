const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:Theophilus2009%40123@db.zjystdpxlobcdukjxcii.supabase.co:5432/postgres'
});

client.connect()
  .then(() => client.query("INSERT INTO runners (id, user_id, vehicle_type, is_available, rating, total_deliveries) VALUES ($1, $2, $3, $4, $5, $6)", 
    ['68c8f38b-dfa8-4b42-ad10-548b1996e792', '68c8f38b-dfa8-4b42-ad10-548b1996e791', 'Motorcycle', true, 5.0, 0]))
  .then(() => console.log('Runner created successfully'))
  .catch(e => console.error(e))
  .finally(() => client.end());
