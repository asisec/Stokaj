const { neon } = require("@neondatabase/serverless");

async function testSales() {
  const url = "postgresql://neondb_owner:npg_yCfcN4bD0msp@ep-solitary-voice-ai1hivfd.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
  const sql = neon(url);
  try {
    const wrappedSql = function(strings, ...values) {
      const cleanValues = values.map(v => v === undefined ? null : v);
      return sql(strings, ...cleanValues);
    };

    // We can just try to SELECT something or test a typical insertion with all expected fields
    // Wait, the sales API doesn't use missing fields if the user creates a valid request.
    // Let's test the /api/sales code logic by just fetching the existing motorcycles.
    const res = await wrappedSql`SELECT * FROM sales LIMIT 1`;
    console.log("Success:", res);
  } catch (e) {
    console.error("Error:", e);
  }
}

testSales();
