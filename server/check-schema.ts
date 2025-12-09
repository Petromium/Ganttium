
import "dotenv/config";
import { db } from "./db";
import { sql } from "drizzle-orm";

async function checkSchema() {
  console.log("Checking schema for project_templates...");
  
  const result = await db.execute(sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'project_templates';
  `);
  
  console.log("Columns in project_templates:");
  result.rows.forEach(row => {
    console.log(`- ${row.column_name} (${row.data_type})`);
  });
}

checkSchema().catch(console.error).finally(() => process.exit());

