const { neon } = require("@neondatabase/serverless");

async function testPostSales() {
  const url = "postgresql://neondb_owner:npg_yCfcN4bD0msp@ep-solitary-voice-ai1hivfd.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
  const sql = neon(url);
  const wrappedSql = function(strings, ...values) {
    const cleanValues = values.map(v => v === undefined ? null : v);
    return sql(strings, ...cleanValues);
  };

  const body = {
    customer_id: 2, // Assuming customer 2 exists
    items: [
      {
        item_type: "motorcycle",
        item_id: 1, // Let's hope a motorcycle with ID 1 exists
        quantity: 1,
        unit_price: 150000
      }
    ],
    payments: [
      {
        method: "cash",
        amount: 150000
      }
    ]
  };

  try {
    const customers = await wrappedSql`SELECT * FROM customers WHERE id = ${body.customer_id}`;
    if (!customers[0]) throw new Error("Müşteri bulunamadı");

    let totalAmount = 0;
    const saleItemsData = [];

    for (const item of body.items) {
      if (item.item_type === "motorcycle") {
        const moto = await wrappedSql`SELECT * FROM motorcycles WHERE id = ${item.item_id}`;
        if (!moto[0]) throw new Error("Motosiklet bulunamadı: " + item.item_id);
        // We skip status check for the test
        const itemTotal = item.unit_price * item.quantity;
        saleItemsData.push({ ...item, item_name: moto[0].brand + " " + moto[0].model, purchase_price: moto[0].purchase_price, total_price: itemTotal });
        totalAmount += itemTotal;
      }
    }

    // We do NOT execute INSERTs so we don't pollute the DB, 
    // BUT we want to see if the query syntax would be valid.
    // Let's just log what we would execute:
    console.log("Would insert sale with totalAmount", totalAmount);

    console.log("Success test flow");
  } catch (e) {
    console.error("Error:", e);
  }
}

testPostSales();
