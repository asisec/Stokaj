const { neon } = require("@neondatabase/serverless");

async function resetBalances() {
  const url = "postgresql://neondb_owner:npg_yCfcN4bD0msp@ep-solitary-voice-ai1hivfd.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
  const sql = neon(url);
  try {
    // Reset balances to 0
    await sql`UPDATE customers SET balance = 0, updated_at = NOW()`;
    
    // Clear transactions
    await sql`DELETE FROM customer_transactions`;
    
    console.log("Balances and transactions have been reset.");
  } catch (e) {
    console.error("Error:", e);
  }
}

resetBalances();
