
const { Client } = require('pg');
require('dotenv').config();

async function test() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    await client.connect();
    console.log('Connected successfully to PostgreSQL!');
    const res = await client.query('SELECT current_database(), current_user');
    console.log(res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Connection error details:', err);
  }
}

test();
