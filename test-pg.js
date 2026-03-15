const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL.replace(/ Truongtuan123%40/, 'Truongtuan123@'), // Ensure @ is not double-encoded if necessary, though it should be encoded
  });

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('Connected successfully!');
    const res = await client.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Connection error:', err.message);
    console.log('Attempting with encoded password...');
    
    const client2 = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    
    try {
       await client2.connect();
       console.log('Connected successfully with encoded password!');
       await client2.end();
    } catch (err2) {
       console.error('Connection error with encoded:', err2.message);
    }
  }
}

testConnection();
