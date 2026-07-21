const { neon } = require("@neondatabase/serverless");

async function testInsert() {
  const url = "postgresql://neondb_owner:npg_yCfcN4bD0msp@ep-solitary-voice-ai1hivfd.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
  const sql = neon(url);
  const wrappedSql = function(strings, ...values) {
    const cleanValues = values.map(v => v === undefined ? null : v);
    return sql(strings, ...cleanValues);
  };

  try {
    const body = {
        brand: "Honda",
        model: "CBR250R",
        year: 2023,
        chassis_number: "TEST-" + Math.random(),
    };
    
    // Using wrappedSql
    const rows = await wrappedSql`
      INSERT INTO motorcycles (brand, model, year, color, chassis_number, engine_number, status, purchase_price, sale_price, notes, created_at, updated_at)
      VALUES (${body.brand}, ${body.model}, ${body.year}, ${body.color || ""}, ${body.chassis_number}, ${body.engine_number || ""}, ${body.status || "available"}, ${body.purchase_price || 0}, ${body.sale_price || 0}, ${body.notes || ""}, NOW(), NOW())
      RETURNING *`;
      
    console.log("Success with wrappedSql:", rows[0].id);
  } catch (e) {
    console.error("Error with wrappedSql:", e);
  }
}

testInsert();
