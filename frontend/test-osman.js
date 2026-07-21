const { neon } = require("@neondatabase/serverless");

async function checkOsman() {
  const url = "postgresql://neondb_owner:npg_yCfcN4bD0msp@ep-solitary-voice-ai1hivfd.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
  const sql = neon(url);
  try {
    const cust = await sql`SELECT * FROM customers WHERE first_name = 'OSMAN'`;
    console.log("Customer:", cust[0]);

    if (cust[0]) {
        const trans = await sql`SELECT * FROM customer_transactions WHERE customer_id = ${cust[0].id}`;
        console.log("Transactions:", trans);

        const sales = await sql`SELECT * FROM sales WHERE customer_id = ${cust[0].id}`;
        console.log("Sales:", sales);
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

checkOsman();
