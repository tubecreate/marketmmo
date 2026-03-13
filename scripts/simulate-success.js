const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../dev.db');
const db = new Database(dbPath);

const paymentCode = process.argv[2];

if (!paymentCode) {
  console.error('Please provide a payment code (e.g., MKTXXXXXX)');
  process.exit(1);
}

try {
  // Find the transaction
  const transaction = db.prepare('SELECT * FROM "Transaction" WHERE description = ? AND status = \'PENDING\'').get(paymentCode);
  
  if (!transaction) {
    console.error(`No pending transaction found with code: ${paymentCode}`);
    process.exit(1);
  }

  // Update status to SUCCESS and increment user balance
  const updateTransaction = db.prepare('UPDATE "Transaction" SET status = \'SUCCESS\' WHERE id = ?');
  const updateUser = db.prepare('UPDATE User SET balance = balance + ? WHERE id = ?');

  const transactionUpdate = db.transaction(() => {
    updateTransaction.run(transaction.id);
    updateUser.run(transaction.amount, transaction.userId);
  });

  transactionUpdate();
  console.log(`Successfully updated transaction ${paymentCode} to SUCCESS and updated user balance.`);

} catch (err) {
  console.error('Simulation error:', err);
} finally {
  db.close();
}
