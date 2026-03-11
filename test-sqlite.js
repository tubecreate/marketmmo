import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./prisma/dev.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the dev.db SQLite database.');
    db.all(`SELECT id, role, balance, holdBalance FROM User`, [], (err, rows) => {
      if (err) {
        throw err;
      }
      rows.forEach((row) => {
        console.log(row);
      });
      db.close();
    });
  }
});
