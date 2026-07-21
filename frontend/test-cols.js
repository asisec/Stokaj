const { neon } = require("@neondatabase/serverless");

async function checkCols() {
  const url = "postgresql://neondb_owner:npg_yCfcN4bD0msp@ep-solitary-voice-ai1hivfd.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
  const sql = neon(url);
  try {
    const cols = await sql`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, ordinal_position`;
    console.log(cols.reduce((acc, row) => {
        acc[row.table_name] = acc[row.table_name] || [];
        acc[row.table_name].push(row.column_name);
        return acc;
    }, {}));
  } catch (e) {
    console.error("Error:", e);
  }
}

checkCols();
