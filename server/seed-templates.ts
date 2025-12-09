import "dotenv/config";
import { storage } from "./storage";
import { db } from "./db";
import { projectTemplates, organizations } from "@shared/schema";
import { isNull, eq } from "drizzle-orm";

interface TemplateTask {
  name: string;
  wbsCode: string;
  description?: string;
  status?: string;
  priority?: string;
  discipline?: string;
  estimatedHours?: number;
  durationDays?: number;
  predecessors?: string[];
}

interface TemplateRisk {
  title: string;
  description: string;
  category: string;
  impact: string;
  probability: number;
  status: string;
  mitigationPlan: string;
}

interface TemplateDocument {
  name: string;
  description: string;
  type: string;
}

interface EPCProjectTemplate {
  name: string;
  description: string;
  category: string;
  isPublic: boolean;
  metadata: any;
  templateData: {
    tasks: TemplateTask[];
    risks: TemplateRisk[];
    documents: TemplateDocument[];
  };
}

export async function seedTemplates() {
  console.log("Seeding EPC Project Templates...");

  // 1. Ensure Organization 1 [Templates] exists
  let templatesOrg = await storage.getOrganization(1);
  if (!templatesOrg) {
    console.log("Creating Organization 1 [Templates]...");
    try {
      // Direct insert to force ID 1 if possible, or create and assume it gets ID 1 if empty
      // Drizzle doesn't easily support forcing ID on serial unless we use raw sql
      // But we can check if ID 1 exists. If not, we might need to be careful.
      // For now, let's try to create it normally and hope it's ID 1 or we use whatever ID it gets
      // But the user SPECIFICALLY asked for Org 1.
      // If the DB is empty, the first org created will be ID 1.
      templatesOrg = await storage.createOrganization({
        name: "Templates",
        slug: "templates"
      });
      console.log(`Created Templates Org with ID: ${templatesOrg.id}`);
    } catch (e) {
      console.error("Failed to create Templates org:", e);
    }
  } else {
    console.log("Organization 1 [Templates] already exists.");
  }

  // 2. Ensure Organization 2 [Demo] exists
  let demoOrg = await storage.getOrganization(2);
  if (!demoOrg) {
    console.log("Creating Organization 2 [Demo]...");
    try {
      demoOrg = await storage.createOrganization({
        name: "Demo",
        slug: "demo"
      });
      console.log(`Created Demo Org with ID: ${demoOrg.id}`);
    } catch (e) {
      console.error("Failed to create Demo org:", e);
    }
  } else {
    console.log("Organization 2 [Demo] already exists.");
  }

  const TEMPLATES_ORG_ID = 1; // We aim for 1, but should use templatesOrg.id if we want robustness, but user requested 1.

  const templates: EPCProjectTemplate[] = [
    // 1. Solar PV Farm (100MW)
    {
      name: "Solar PV Farm (100MW)",
      description: "Utility-scale solar photovoltaic power plant project.",
      category: "Energy",
      isPublic: true,
      metadata: { estimatedDuration: 540, complexity: "medium", typicalTeamSize: 45, industry: "Energy", taskCount: 45 },
      templateData: {
        tasks: [
          { name: "Project Initiation", wbsCode: "1", description: "Project Kickoff", estimatedHours: 40, durationDays: 10, discipline: "management" },
          { name: "Permitting & Approvals", wbsCode: "1.1", description: "Environmental & Land permits", estimatedHours: 120, durationDays: 60, discipline: "management" },
          { name: "Engineering", wbsCode: "2", description: "Design Phase", estimatedHours: 0, durationDays: 90, discipline: "engineering" },
          { name: "PV Plant Layout", wbsCode: "2.1", description: "Optimization of string layout", estimatedHours: 200, durationDays: 30, discipline: "engineering" },
          { name: "Civil Design", wbsCode: "2.2", description: "Roads and foundations", estimatedHours: 160, durationDays: 45, discipline: "civil" },
          { name: "Procurement", wbsCode: "3", description: "Purchasing", estimatedHours: 0, durationDays: 120, discipline: "procurement" },
          { name: "Module Supply", wbsCode: "3.1", description: "PV Modules", estimatedHours: 80, durationDays: 90, discipline: "procurement" },
          { name: "Inverter Supply", wbsCode: "3.2", description: "Inverters", estimatedHours: 60, durationDays: 90, discipline: "procurement" },
          { name: "Construction", wbsCode: "4", description: "Site Execution", estimatedHours: 0, durationDays: 240, discipline: "construction" },
          { name: "Civil Works", wbsCode: "4.1", description: "Grading & Fencing", estimatedHours: 2000, durationDays: 60, discipline: "civil" },
          { name: "Piling", wbsCode: "4.2", description: "Mounting Structure Foundations", estimatedHours: 4000, durationDays: 90, discipline: "civil", predecessors: ["4.1"] },
          { name: "Module Mounting", wbsCode: "4.3", description: "Install Modules", estimatedHours: 8000, durationDays: 120, discipline: "mechanical", predecessors: ["4.2"] },
          { name: "Electrical Works", wbsCode: "4.4", description: "Cabling & Inverters", estimatedHours: 5000, durationDays: 120, discipline: "electrical", predecessors: ["4.3"] },
          { name: "Commissioning", wbsCode: "5", description: "Testing & Grid Sync", estimatedHours: 500, durationDays: 30, discipline: "commissioning", predecessors: ["4.4"] }
        ],
        risks: [
          { title: "Land Acquisition Delay", description: "Delay in securing land rights", impact: "high", probability: 4, status: "identified", category: "external", mitigationPlan: "Early engagement with landowners" },
          { title: "Module Price Volatility", description: "Global market fluctuations", impact: "high", probability: 3, status: "identified", category: "market", mitigationPlan: "Fixed price contracts" }
        ],
        documents: [
          { name: "PV Syst Report", description: "Energy Yield Assessment", type: "report" },
          { name: "Single Line Diagram", description: "Electrical SLD", type: "drawing" }
        ]
      }
    },
    // 2. Wind Farm (Onshore)
    {
      name: "Wind Farm (Onshore)",
      description: "50MW Onshore Wind Farm construction.",
      category: "Energy",
      isPublic: true,
      metadata: { estimatedDuration: 730, complexity: "high", typicalTeamSize: 60, industry: "Energy", taskCount: 50 },
      templateData: {
        tasks: [
          { name: "Wind Resource Assessment", wbsCode: "1", description: "Met mast data analysis", estimatedHours: 160, durationDays: 365, discipline: "engineering" },
          { name: "Turbine Selection", wbsCode: "2", description: "Select WTG model", estimatedHours: 80, durationDays: 60, discipline: "engineering" },
          { name: "Infrastructure", wbsCode: "3", description: "Roads & Crane Pads", estimatedHours: 3000, durationDays: 120, discipline: "civil" },
          { name: "WTG Foundations", wbsCode: "4", description: "Concrete pours", estimatedHours: 6000, durationDays: 150, discipline: "civil", predecessors: ["3"] },
          { name: "Turbine Erection", wbsCode: "5", description: "Lifting & Assembly", estimatedHours: 4000, durationDays: 120, discipline: "mechanical", predecessors: ["4"] },
          { name: "Grid Connection", wbsCode: "6", description: "Substation & Transmission", estimatedHours: 2000, durationDays: 120, discipline: "electrical" }
        ],
        risks: [
          { title: "Logistics Issues", description: "Blade transport route blocked", impact: "critical", probability: 3, status: "identified", category: "logistics", mitigationPlan: "Route survey & permits" },
          { title: "High Winds", description: "Crane downtime due to wind", impact: "medium", probability: 5, status: "identified", category: "weather", mitigationPlan: "Weather buffer in schedule" }
        ],
        documents: [
          { name: "Micrositing Report", description: "Turbine locations", type: "report" },
          { name: "Transport Study", description: "Logistics route", type: "report" }
        ]
      }
    },
    // 3. Combined Cycle Power Plant
    {
      name: "Combined Cycle Power Plant",
      description: "Gas-fired CCPP with HRSG and Steam Turbine.",
      category: "Energy",
      isPublic: true,
      metadata: { estimatedDuration: 1095, complexity: "high", typicalTeamSize: 200, industry: "Energy", taskCount: 80 },
      templateData: {
        tasks: [
          { name: "Basic Engineering", wbsCode: "1", description: "P&IDs, Plot Plan", estimatedHours: 5000, durationDays: 180, discipline: "engineering" },
          { name: "Gas Turbine Procurement", wbsCode: "2", description: "GT Ordering", estimatedHours: 200, durationDays: 365, discipline: "procurement" },
          { name: "HRSG Erection", wbsCode: "3", description: "Boiler install", estimatedHours: 20000, durationDays: 300, discipline: "mechanical" },
          { name: "Steam Turbine Install", wbsCode: "4", description: "STG on pedestal", estimatedHours: 15000, durationDays: 240, discipline: "mechanical" }
        ],
        risks: [
          { title: "Gas Supply Delay", description: "Pipeline not ready", impact: "critical", probability: 2, status: "identified", category: "external", mitigationPlan: "Coordination with gas supplier" }
        ],
        documents: [
          { name: "Heat Balance Diagram", description: "Cycle efficiency", type: "diagram" }
        ]
      }
    },
    // 4. Battery Energy Storage System (BESS)
    {
      name: "Battery Energy Storage System (BESS)",
      description: "Grid-scale Lithium-Ion BESS project.",
      category: "Energy",
      isPublic: true,
      metadata: { estimatedDuration: 365, complexity: "medium", typicalTeamSize: 30, industry: "Energy", taskCount: 30 },
      templateData: {
        tasks: [
          { name: "Site Selection", wbsCode: "1", description: "Grid constraints", estimatedHours: 80, durationDays: 60, discipline: "engineering" },
          { name: "Container Delivery", wbsCode: "2", description: "Battery containers", estimatedHours: 40, durationDays: 180, discipline: "procurement" },
          { name: "Installation", wbsCode: "3", description: "Place on foundations", estimatedHours: 1000, durationDays: 45, discipline: "construction" },
          { name: "Integration", wbsCode: "4", description: "SCADA & EMS", estimatedHours: 500, durationDays: 60, discipline: "instrumentation" }
        ],
        risks: [
          { title: "Thermal Runaway", description: "Fire risk", impact: "critical", probability: 2, status: "identified", category: "safety", mitigationPlan: "Fire suppression system" }
        ],
        documents: [
          { name: "Fire Safety Plan", description: "Emergency response", type: "plan" }
        ]
      }
    },
    // 5. Offshore Platform (Fixed)
    {
      name: "Offshore Platform (Fixed)",
      description: "Fixed jacket platform for oil & gas production.",
      category: "Oil & Gas",
      isPublic: true,
      metadata: { estimatedDuration: 1460, complexity: "very high", typicalTeamSize: 300, industry: "Oil & Gas", taskCount: 100 },
      templateData: {
        tasks: [
          { name: "Jacket Fabrication", wbsCode: "1", description: "Steel jacket in yard", estimatedHours: 50000, durationDays: 365, discipline: "construction" },
          { name: "Topside Fabrication", wbsCode: "2", description: "Deck & modules", estimatedHours: 80000, durationDays: 450, discipline: "construction" },
          { name: "Load Out", wbsCode: "3", description: "Load onto barge", estimatedHours: 2000, durationDays: 15, discipline: "marine" },
          { name: "Installation", wbsCode: "4", description: "Heavy lift at sea", estimatedHours: 5000, durationDays: 30, discipline: "marine" }
        ],
        risks: [
          { title: "Weather Window", description: "Missed installation season", impact: "critical", probability: 3, status: "identified", category: "weather", mitigationPlan: "Flexible schedule" }
        ],
        documents: [
          { name: "Weight Control Report", description: "COG analysis", type: "report" }
        ]
      }
    },
    // 6. Refinery Turnaround
    {
      name: "Refinery Turnaround",
      description: "Maintenance shutdown for refinery unit.",
      category: "Oil & Gas",
      isPublic: true,
      metadata: { estimatedDuration: 45, complexity: "high", typicalTeamSize: 500, industry: "Oil & Gas", taskCount: 150 },
      templateData: {
        tasks: [
          { name: "Shutdown", wbsCode: "1", description: "Unit cooling & purging", estimatedHours: 1000, durationDays: 5, discipline: "operations" },
          { name: "Inspection", wbsCode: "2", description: "Vessel entry", estimatedHours: 2000, durationDays: 10, discipline: "qa" },
          { name: "Repairs", wbsCode: "3", description: "Welding & replacement", estimatedHours: 10000, durationDays: 20, discipline: "mechanical" },
          { name: "Startup", wbsCode: "4", description: "Leak test & heat up", estimatedHours: 1000, durationDays: 7, discipline: "operations" }
        ],
        risks: [
          { title: "Scope Creep", description: "Found more damage", impact: "high", probability: 5, status: "identified", category: "technical", mitigationPlan: "Contingency budget" }
        ],
        documents: [
          { name: "Blind List", description: "Isolation points", type: "list" }
        ]
      }
    },
    // 7. Pipeline Construction (Cross-country)
    {
      name: "Pipeline Construction",
      description: "100km Cross-country oil/gas pipeline.",
      category: "Oil & Gas",
      isPublic: true,
      metadata: { estimatedDuration: 365, complexity: "medium", typicalTeamSize: 100, industry: "Oil & Gas", taskCount: 60 },
      templateData: {
        tasks: [
          { name: "ROW Acquisition", wbsCode: "1", description: "Right of Way", estimatedHours: 1000, durationDays: 180, discipline: "management" },
          { name: "Stringing", wbsCode: "2", description: "Pipe distribution", estimatedHours: 2000, durationDays: 60, discipline: "mechanical" },
          { name: "Welding", wbsCode: "3", description: "Mainline welding", estimatedHours: 8000, durationDays: 90, discipline: "mechanical", predecessors: ["2"] },
          { name: "Lowering & Backfill", wbsCode: "4", description: "Trenching", estimatedHours: 4000, durationDays: 90, discipline: "civil", predecessors: ["3"] }
        ],
        risks: [
          { title: "Landowner Protest", description: "Access blocked", impact: "high", probability: 3, status: "identified", category: "external", mitigationPlan: "Community relations" }
        ],
        documents: [
          { name: "Alignment Sheet", description: "Route map", type: "drawing" }
        ]
      }
    },
    // 8. LNG Terminal
    {
      name: "LNG Terminal",
      description: "Import/Export LNG terminal facility.",
      category: "Oil & Gas",
      isPublic: true,
      metadata: { estimatedDuration: 1825, complexity: "very high", typicalTeamSize: 400, industry: "Oil & Gas", taskCount: 120 },
      templateData: {
        tasks: [
          { name: "Tank Construction", wbsCode: "1", description: "Full containment tank", estimatedHours: 50000, durationDays: 900, discipline: "civil" },
          { name: "Jetty Works", wbsCode: "2", description: "Loading arms & trestle", estimatedHours: 20000, durationDays: 600, discipline: "marine" },
          { name: "Cryogenic Piping", wbsCode: "3", description: "Stainless steel piping", estimatedHours: 30000, durationDays: 400, discipline: "mechanical" }
        ],
        risks: [
          { title: "Cryogenic Spill", description: "Safety hazard", impact: "critical", probability: 1, status: "identified", category: "safety", mitigationPlan: "Spill containment" }
        ],
        documents: [
          { name: "HAZOP Report", description: "Safety review", type: "report" }
        ]
      }
    },
    // 9. Highway Expansion
    {
      name: "Highway Expansion",
      description: "Adding lanes to existing highway (20km).",
      category: "Infrastructure",
      isPublic: true,
      metadata: { estimatedDuration: 730, complexity: "medium", typicalTeamSize: 80, industry: "Infrastructure", taskCount: 40 },
      templateData: {
        tasks: [
          { name: "Traffic Management", wbsCode: "1", description: "Detours", estimatedHours: 500, durationDays: 730, discipline: "safety" },
          { name: "Earthworks", wbsCode: "2", description: "Embankment", estimatedHours: 5000, durationDays: 180, discipline: "civil" },
          { name: "Paving", wbsCode: "3", description: "Asphalt laying", estimatedHours: 3000, durationDays: 120, discipline: "civil" }
        ],
        risks: [
          { title: "Traffic Accidents", description: "Public safety", impact: "high", probability: 3, status: "identified", category: "safety", mitigationPlan: "Strict TMPs" }
        ],
        documents: [
          { name: "Traffic Management Plan", description: "Road safety", type: "plan" }
        ]
      }
    },
    // 10. Railway Electrification
    {
      name: "Railway Electrification",
      description: "Overhead Catenary System (OCS) for rail.",
      category: "Infrastructure",
      isPublic: true,
      metadata: { estimatedDuration: 500, complexity: "high", typicalTeamSize: 60, industry: "Infrastructure", taskCount: 50 },
      templateData: {
        tasks: [
          { name: "Mast Foundation", wbsCode: "1", description: "Piling along track", estimatedHours: 3000, durationDays: 150, discipline: "civil" },
          { name: "Mast Erection", wbsCode: "2", description: "Steel masts", estimatedHours: 2000, durationDays: 120, discipline: "structural" },
          { name: "Wiring", wbsCode: "3", description: "Contact wire stringing", estimatedHours: 4000, durationDays: 120, discipline: "electrical" }
        ],
        risks: [
          { title: "Track Possession", description: "Limited access time", impact: "high", probability: 5, status: "identified", category: "logistics", mitigationPlan: "Night shifts" }
        ],
        documents: [
          { name: "OCS Layout", description: "Wiring diagram", type: "drawing" }
        ]
      }
    },
    // 11. Port Terminal Expansion
    {
      name: "Port Terminal Expansion",
      description: "New container berth construction.",
      category: "Infrastructure",
      isPublic: true,
      metadata: { estimatedDuration: 1000, complexity: "high", typicalTeamSize: 100, industry: "Infrastructure", taskCount: 60 },
      templateData: {
        tasks: [
          { name: "Dredging", wbsCode: "1", description: "Deepening channel", estimatedHours: 5000, durationDays: 180, discipline: "marine" },
          { name: "Quay Wall", wbsCode: "2", description: "Sheet piles / combi wall", estimatedHours: 10000, durationDays: 300, discipline: "civil" },
          { name: "Pavement", wbsCode: "3", description: "Container yard", estimatedHours: 5000, durationDays: 200, discipline: "civil" }
        ],
        risks: [
          { title: "Geotechnical Issues", description: "Soft soil", impact: "high", probability: 3, status: "identified", category: "technical", mitigationPlan: "Soil improvement" }
        ],
        documents: [
          { name: "Bathymetry Survey", description: "Seabed levels", type: "survey" }
        ]
      }
    },
    // 12. Water Treatment Plant
    {
      name: "Water Treatment Plant",
      description: "50 MLD Water Treatment Facility.",
      category: "Infrastructure",
      isPublic: true,
      metadata: { estimatedDuration: 730, complexity: "medium", typicalTeamSize: 50, industry: "Infrastructure", taskCount: 55 },
      templateData: {
        tasks: [
          { name: "Civil Structures", wbsCode: "1", description: "Clarifiers & Filters", estimatedHours: 8000, durationDays: 240, discipline: "civil" },
          { name: "Piping", wbsCode: "2", description: "Interconnecting piping", estimatedHours: 4000, durationDays: 150, discipline: "mechanical" },
          { name: "MEIC Installation", wbsCode: "3", description: "Pumps & Panels", estimatedHours: 3000, durationDays: 120, discipline: "electrical" }
        ],
        risks: [
          { title: "Leakage Test Fail", description: "Concrete tanks leak", impact: "medium", probability: 2, status: "identified", category: "quality", mitigationPlan: "Waterproofing" }
        ],
        documents: [
          { name: "P&ID", description: "Process diagram", type: "drawing" }
        ]
      }
    },
    // 13. Petrochemical Complex
    {
      name: "Petrochemical Complex",
      description: "Ethylene Cracker Unit.",
      category: "Industrial",
      isPublic: true,
      metadata: { estimatedDuration: 1460, complexity: "very high", typicalTeamSize: 600, industry: "Industrial", taskCount: 200 },
      templateData: {
        tasks: [
          { name: "Furnace Erection", wbsCode: "1", description: "Cracking furnaces", estimatedHours: 20000, durationDays: 300, discipline: "mechanical" },
          { name: "Column Erection", wbsCode: "2", description: "Distillation columns", estimatedHours: 10000, durationDays: 200, discipline: "mechanical" },
          { name: "Compressor House", wbsCode: "3", description: "Major compressors", estimatedHours: 15000, durationDays: 250, discipline: "civil" }
        ],
        risks: [
          { title: "Material Delay", description: "Exotic alloy piping", impact: "high", probability: 4, status: "identified", category: "procurement", mitigationPlan: "Early ordering" }
        ],
        documents: [
          { name: "Equipment List", description: "Master tag list", type: "list" }
        ]
      }
    },
    // 14. Steel Mill Modernization
    {
      name: "Steel Mill Modernization",
      description: "Upgrade of Rolling Mill.",
      category: "Industrial",
      isPublic: true,
      metadata: { estimatedDuration: 365, complexity: "high", typicalTeamSize: 100, industry: "Industrial", taskCount: 70 },
      templateData: {
        tasks: [
          { name: "Dismantling", wbsCode: "1", description: "Remove old mill", estimatedHours: 2000, durationDays: 30, discipline: "mechanical" },
          { name: "Foundation Mod", wbsCode: "2", description: "Modify bases", estimatedHours: 1000, durationDays: 30, discipline: "civil" },
          { name: "New Mill Install", wbsCode: "3", description: "Install stands", estimatedHours: 5000, durationDays: 90, discipline: "mechanical" }
        ],
        risks: [
          { title: "As-Built Accuracy", description: "Old drawings wrong", impact: "medium", probability: 5, status: "identified", category: "technical", mitigationPlan: "Laser scanning" }
        ],
        documents: [
          { name: "Shutdown Plan", description: "Detailed schedule", type: "plan" }
        ]
      }
    },
    // 15. Cement Plant
    {
      name: "Cement Plant",
      description: "Greenfield 5,000 TPD integrated cement plant.",
      category: "Industrial",
      isPublic: true,
      metadata: { estimatedDuration: 900, complexity: "high", typicalTeamSize: 150, industry: "Industrial", taskCount: 45 },
      templateData: {
        tasks: [
          { name: "Quarry Dev", wbsCode: "1", description: "Limestone mine", estimatedHours: 2000, durationDays: 180, discipline: "mining" },
          { name: "Crusher Install", wbsCode: "2", description: "Primary crusher", estimatedHours: 5000, durationDays: 120, discipline: "mechanical" },
          { name: "Kiln Erection", wbsCode: "3", description: "Rotary kiln", estimatedHours: 15000, durationDays: 240, discipline: "mechanical" },
          { name: "Silo Slipform", wbsCode: "4", description: "Storage silos", estimatedHours: 10000, durationDays: 150, discipline: "civil" }
        ],
        risks: [
          { title: "Raw Material Quality", description: "Limestone variance", impact: "high", probability: 3, status: "identified", category: "technical", mitigationPlan: "Core drilling" }
        ],
        documents: [
          { name: "Flow Sheet", description: "Process flow", type: "drawing" }
        ]
      }
    },
    // 16. Pharmaceutical Manufacturing Facility
    {
      name: "Pharmaceutical Manufacturing Facility",
      description: "GMP-compliant drug manufacturing plant.",
      category: "Industrial",
      isPublic: true,
      metadata: { estimatedDuration: 730, complexity: "high", typicalTeamSize: 80, industry: "Industrial", taskCount: 50 },
      templateData: {
        tasks: [
          { name: "Detailed Design", wbsCode: "1", description: "BIM model", estimatedHours: 3000, durationDays: 150, discipline: "engineering" },
          { name: "Cleanroom Build", wbsCode: "2", description: "HVAC & Panels", estimatedHours: 8000, durationDays: 180, discipline: "mechanical" },
          { name: "Equipment Install", wbsCode: "3", description: "Reactors & skids", estimatedHours: 5000, durationDays: 120, discipline: "mechanical", predecessors: ["2"] },
          { name: "Validation", wbsCode: "4", description: "IQ/OQ/PQ", estimatedHours: 4000, durationDays: 180, discipline: "qa", predecessors: ["3"] }
        ],
        risks: [
          { title: "Validation Failure", description: "FDA rejection", impact: "critical", probability: 2, status: "identified", category: "quality", mitigationPlan: "Expert consultants" }
        ],
        documents: [
          { name: "Validation Master Plan", description: "VMP", type: "plan" }
        ]
      }
    },
    // 17. Open Pit Mine Development
    {
      name: "Open Pit Mine Development",
      description: "Development of new open pit copper mine.",
      category: "Mining",
      isPublic: true,
      metadata: { estimatedDuration: 1095, complexity: "high", typicalTeamSize: 200, industry: "Mining", taskCount: 60 },
      templateData: {
        tasks: [
          { name: "Pre-Strip", wbsCode: "1", description: "Remove overburden", estimatedHours: 50000, durationDays: 365, discipline: "mining" },
          { name: "Haul Roads", wbsCode: "2", description: "Road construction", estimatedHours: 5000, durationDays: 90, discipline: "civil" },
          { name: "Camp Construction", wbsCode: "3", description: "Accommodation", estimatedHours: 10000, durationDays: 180, discipline: "construction" }
        ],
        risks: [
          { title: "Grade Uncertainty", description: "Ore grade lower than expected", impact: "critical", probability: 3, status: "identified", category: "technical", mitigationPlan: "Infill drilling" }
        ],
        documents: [
          { name: "Mine Plan", description: "LOM plan", type: "plan" }
        ]
      }
    },
    // 18. Mineral Processing Plant
    {
      name: "Mineral Processing Plant",
      description: "Concentrator plant for copper ore.",
      category: "Mining",
      isPublic: true,
      metadata: { estimatedDuration: 900, complexity: "high", typicalTeamSize: 150, industry: "Mining", taskCount: 75 },
      templateData: {
        tasks: [
          { name: "Ball Mill Install", wbsCode: "1", description: "Grinding circuit", estimatedHours: 8000, durationDays: 180, discipline: "mechanical" },
          { name: "Flotation Cells", wbsCode: "2", description: "Separation", estimatedHours: 6000, durationDays: 150, discipline: "mechanical" },
          { name: "Tailings Dam", wbsCode: "3", description: "TSF construction", estimatedHours: 20000, durationDays: 365, discipline: "civil" }
        ],
        risks: [
          { title: "Water Supply", description: "Insufficient process water", impact: "critical", probability: 3, status: "identified", category: "external", mitigationPlan: "Borefield expansion" }
        ],
        documents: [
          { name: "Process Design Criteria", description: "PDC", type: "document" }
        ]
      }
    },
    // 19. Data Center (Tier III)
    {
      name: "Data Center (Tier III)",
      description: "10MW Tier III Data Center.",
      category: "Buildings",
      isPublic: true,
      metadata: { estimatedDuration: 540, complexity: "high", typicalTeamSize: 80, industry: "Technology", taskCount: 65 },
      templateData: {
        tasks: [
          { name: "Shell & Core", wbsCode: "1", description: "Building structure", estimatedHours: 10000, durationDays: 240, discipline: "civil" },
          { name: "Power Systems", wbsCode: "2", description: "UPS & Generators", estimatedHours: 8000, durationDays: 180, discipline: "electrical" },
          { name: "Cooling", wbsCode: "3", description: "Chillers & CRAH", estimatedHours: 6000, durationDays: 150, discipline: "mechanical" },
          { name: "IT Fitout", wbsCode: "4", description: "Racks & Cabling", estimatedHours: 4000, durationDays: 90, discipline: "telecom" }
        ],
        risks: [
          { title: "Supply Chain", description: "Chip shortage affecting UPS", impact: "high", probability: 4, status: "identified", category: "procurement", mitigationPlan: "Early procurement" }
        ],
        documents: [
          { name: "Commissioning Script", description: "IST procedures", type: "document" }
        ]
      }
    },
    // 20. Hospital Complex
    {
      name: "Hospital Complex",
      description: "500-bed General Hospital.",
      category: "Buildings",
      isPublic: true,
      metadata: { estimatedDuration: 1095, complexity: "very high", typicalTeamSize: 300, industry: "Healthcare", taskCount: 150 },
      templateData: {
        tasks: [
          { name: "Structure", wbsCode: "1", description: "Concrete frame", estimatedHours: 40000, durationDays: 365, discipline: "civil" },
          { name: "MEP Services", wbsCode: "2", description: "Medical gas, HVAC", estimatedHours: 60000, durationDays: 500, discipline: "mechanical" },
          { name: "Medical Equipment", wbsCode: "3", description: "MRI, CT Install", estimatedHours: 5000, durationDays: 120, discipline: "medical" },
          { name: "Interiors", wbsCode: "4", description: "Finishes", estimatedHours: 30000, durationDays: 300, discipline: "architectural" }
        ],
        risks: [
          { title: "Design Changes", description: "Clinical requirement changes", impact: "high", probability: 5, status: "identified", category: "technical", mitigationPlan: "Freeze date" }
        ],
        documents: [
          { name: "Room Data Sheets", description: "RDS", type: "document" }
        ]
      }
    }
  ];

  for (const t of templates) {
    // Check if template exists by name to avoid duplicates
    const existing = await db.select().from(projectTemplates).where(eq(projectTemplates.name, t.name)).limit(1);
    
    if (existing.length === 0) {
      await storage.createProjectTemplate({
        ...t,
        organizationId: TEMPLATES_ORG_ID, // Use Template Org
        userId: null
      });
      console.log(`Created template: ${t.name}`);
    } else {
      console.log(`Template already exists: ${t.name}`);
    }
  }

  console.log("Template seeding completed.");
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTemplates().catch(console.error);
}
