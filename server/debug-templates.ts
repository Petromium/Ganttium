
import "dotenv/config";
import { storage } from "./storage";
import { db } from "./db";
import { projectTemplates, organizations } from "@shared/schema";
import { eq } from "drizzle-orm";

async function debugTemplates() {
  console.log("Debugging Templates...");

  // 1. Check Templates Org
  const templatesOrg = await storage.getOrganizationBySlug("templates");
  console.log("Templates Org:", templatesOrg);

  if (templatesOrg) {
    // 2. Check raw templates count for this org
    const rawTemplates = await db.select().from(projectTemplates).where(eq(projectTemplates.organizationId, templatesOrg.id));
    console.log(`Raw templates count for Org ${templatesOrg.id}:`, rawTemplates.length);
    if (rawTemplates.length > 0) {
        console.log("Sample raw template:", JSON.stringify(rawTemplates[0], null, 2));
    }
  }

  // 3. Check public templates
  const publicTemplates = await db.select().from(projectTemplates).where(eq(projectTemplates.isPublic, true));
  console.log("Public templates count:", publicTemplates.length);

  // 4. Run storage function
  try {
    const results = await storage.getProjectTemplates();
    console.log("storage.getProjectTemplates() count:", results.length);
    if (results.length > 0) {
        console.log("Sample result:", JSON.stringify(results[0], null, 2));
    }
  } catch (e) {
    console.error("Error calling storage.getProjectTemplates():", e);
  }
}

debugTemplates().catch(console.error).finally(() => process.exit());

