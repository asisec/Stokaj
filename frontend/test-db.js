const { neon } = require("@neondatabase/serverless");

async function test() {
  const url = "postgresql://neondb_owner:npg_yCfcN4bD0msp@ep-solitary-voice-ai1hivfd.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
  const sql = neon(url);
  try {
    const wrappedSql = function(strings, ...values) {
      const cleanValues = values.map(v => v === undefined ? null : v);
      return sql(strings, ...cleanValues);
    };

    const brand = "Yamaha";
    const model = undefined; // simulate missing
    const res = await wrappedSql`INSERT INTO motorcycles (brand, model, year, chassis_number, status, purchase_price, sale_price, created_at, updated_at) VALUES (${brand}, ${model}, 2021, '123456', 'available', 0, 0, NOW(), NOW()) RETURNING *`;
    console.log("Success:", res);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
