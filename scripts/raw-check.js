
const { Client } = require('pg');
require('dotenv').config();

async function check() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    await client.connect();
    const res = await client.query('SELECT count(*) FROM "Product"');
    console.log(`Product count in Supabase: ${res.rows[0].count}`);
    const res2 = await client.query('SELECT count(*) FROM "User"');
    console.log(`User count in Supabase: ${res2.rows[0].count}`);
  } catch (err) {
    console.error('Check failed:', err.message);
  } finally {
    await client.end();
  }
}

check();
