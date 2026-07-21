const { neon } = require("@neondatabase/serverless");

async function checkSchema() {
  const url = "postgresql://neondb_owner:npg_yCfcN4bD0msp@ep-solitary-voice-ai1hivfd.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
  const sql = neon(url);
  try {
    const moto = await sql`SELECT * FROM motorcycles LIMIT 1`;
    console.log("Motorcycles cols:", Object.keys(moto[0] || {}));

    const spare = await sql`SELECT * FROM spare_parts LIMIT 1`;
    console.log("Spare parts cols:", Object.keys(spare[0] || {}));

    const sales = await sql`SELECT * FROM sales LIMIT 1`;
    console.log("Sales cols:", Object.keys(sales[0] || {}));

    const sale_items = await sql`SELECT * FROM sale_items LIMIT 1`;
    console.log("Sale items cols:", Object.keys(sale_items[0] || {}));

    const customers = await sql`SELECT * FROM customers LIMIT 1`;
    console.log("Customers cols:", Object.keys(customers[0] || {}));
  } catch (e) {
    console.error("Error:", e);
  }
}

checkSchema();
