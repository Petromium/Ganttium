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
  console.log("Seeding remaining project templates (9-20)...");

  let orgId: number | null = null;
  const systemOrg = await db.query.organizations.findFirst({
    where: eq(organizations.name, 'System')
  });
  
  if (systemOrg) {
    orgId = systemOrg.id;
  } else {
    const firstOrg = await db.query.organizations.findFirst();
    if (firstOrg) orgId = firstOrg.id;
  }
  
  console.log(`Using Organization ID: ${orgId} for templates`);

  const templates: EPCProjectTemplate[] = [
    // 9. Highway Expansion
    {
      name: "Highway Expansion",
      description: "Widening of 20km highway from 2 to 4 lanes.",
      category: "Infrastructure",
      isPublic: true,
      metadata: { estimatedDuration: 730, complexity: "medium", typicalTeamSize: 100, industry: "Infrastructure", taskCount: 35 },
      templateData: {
        tasks: [
          { name: "Design", wbsCode: "1", description: "Road alignment", estimatedHours: 2000, durationDays: 180, discipline: "civil" },
          { name: "Land Acquisition", wbsCode: "2", description: "ROW", estimatedHours: 1000, durationDays: 365, discipline: "legal" },
          { name: "Earthworks", wbsCode: "3", description: "Cut & Fill", estimatedHours: 10000, durationDays: 200, discipline: "civil", predecessors: ["1", "2"] },
          { name: "Drainage", wbsCode: "4", description: "Culverts", estimatedHours: 5000, durationDays: 120, discipline: "civil", predecessors: ["3"] },
          { name: "Paving", wbsCode: "5", description: "Asphalt", estimatedHours: 8000, durationDays: 150, discipline: "civil", predecessors: ["4"] },
          { name: "Signage", wbsCode: "6", description: "Road furniture", estimatedHours: 1000, durationDays: 60, discipline: "civil", predecessors: ["5"] }
        ],
        risks: [
          { title: "Traffic Management", description: "Public safety during works", impact: "critical", probability: 4, status: "identified", category: "hse", mitigationPlan: "Detour plan" }
        ],
        documents: [
          { name: "Traffic Management Plan", description: "Safety procedures", type: "plan" }
        ]
      }
    },
    // 10. Railway Electrification
    {
      name: "Railway Electrification",
      description: "Overhead catenary system installation for 100km track.",
      category: "Infrastructure",
      isPublic: true,
      metadata: { estimatedDuration: 500, complexity: "high", typicalTeamSize: 80, industry: "Infrastructure", taskCount: 30 },
      templateData: {
        tasks: [
          { name: "Survey", wbsCode: "1", description: "Track survey", estimatedHours: 500, durationDays: 60, discipline: "civil" },
          { name: "Foundations", wbsCode: "2", description: "Mast bases", estimatedHours: 5000, durationDays: 180, discipline: "civil", predecessors: ["1"] },
          { name: "Mast Erection", wbsCode: "3", description: "Steel poles", estimatedHours: 4000, durationDays: 150, discipline: "structural", predecessors: ["2"] },
          { name: "Wiring", wbsCode: "4", description: "Contact wire", estimatedHours: 6000, durationDays: 120, discipline: "electrical", predecessors: ["3"] },
          { name: "Substations", wbsCode: "5", description: "Traction power", estimatedHours: 3000, durationDays: 200, discipline: "electrical" }
        ],
        risks: [
          { title: "Track Access", description: "Limited possession windows", impact: "high", probability: 5, status: "identified", category: "operations", mitigationPlan: "Night shifts" }
        ],
        documents: [
          { name: "Possession Plan", description: "Track access schedule", type: "schedule" }
        ]
      }
    },
    // 11. Port Terminal Expansion
    {
      name: "Port Terminal Expansion",
      description: "Construction of new container berth and dredging.",
      category: "Infrastructure",
      isPublic: true,
      metadata: { estimatedDuration: 1095, complexity: "high", typicalTeamSize: 150, industry: "Infrastructure", taskCount: 45 },
      templateData: {
        tasks: [
          { name: "Dredging", wbsCode: "1", description: "Deepening channel", estimatedHours: 5000, durationDays: 180, discipline: "marine" },
          { name: "Piling", wbsCode: "2", description: "Wharf piles", estimatedHours: 10000, durationDays: 240, discipline: "civil", predecessors: ["1"] },
          { name: "Deck Construction", wbsCode: "3", description: "Concrete deck", estimatedHours: 8000, durationDays: 180, discipline: "civil", predecessors: ["2"] },
          { name: "Equipment Install", wbsCode: "4", description: "STS Cranes", estimatedHours: 2000, durationDays: 90, discipline: "mechanical", predecessors: ["3"] }
        ],
        risks: [
          { title: "Marine Weather", description: "Storms stopping dredging", impact: "high", probability: 3, status: "identified", category: "environmental", mitigationPlan: "Seasonal work" }
        ],
        documents: [
          { name: "Bathymetric Survey", description: "Seabed map", type: "drawing" }
        ]
      }
    },
    // 12. Water Treatment Plant
    {
      name: "Water Treatment Plant",
      description: "Greenfield 50 MGD water treatment facility.",
      category: "Infrastructure",
      isPublic: true,
      metadata: { estimatedDuration: 730, complexity: "medium", typicalTeamSize: 60, industry: "Infrastructure", taskCount: 40 },
      templateData: {
        tasks: [
          { name: "Process Design", wbsCode: "1", description: "Treatment flows", estimatedHours: 1000, durationDays: 90, discipline: "process" },
          { name: "Civil Works", wbsCode: "2", description: "Tanks & buildings", estimatedHours: 8000, durationDays: 365, discipline: "civil" },
          { name: "Mechanical Install", wbsCode: "3", description: "Pumps & pipes", estimatedHours: 6000, durationDays: 180, discipline: "mechanical", predecessors: ["2"] },
          { name: "Electrical & SCADA", wbsCode: "4", description: "Controls", estimatedHours: 4000, durationDays: 120, discipline: "automation", predecessors: ["3"] }
        ],
        risks: [
          { title: "Effluent Quality", description: "Not meeting standards", impact: "critical", probability: 2, status: "identified", category: "technical", mitigationPlan: "Pilot testing" }
        ],
        documents: [
          { name: "Process Flow Diagram", description: "PFD", type: "drawing" }
        ]
      }
    },
    // 13. Petrochemical Complex
    {
      name: "Petrochemical Complex",
      description: "Ethylene cracker and derivatives units.",
      category: "Industrial",
      isPublic: true,
      metadata: { estimatedDuration: 1460, complexity: "critical", typicalTeamSize: 500, industry: "Industrial", taskCount: 80 },
      templateData: {
        tasks: [
          { name: "Licensing", wbsCode: "1", description: "Technology license", estimatedHours: 2000, durationDays: 180, discipline: "process" },
          { name: "EPC Execution", wbsCode: "2", description: "Main contract", estimatedHours: 500000, durationDays: 1000, discipline: "management" },
          { name: "Furnace Erection", wbsCode: "2.1", description: "Cracking furnaces", estimatedHours: 50000, durationDays: 365, discipline: "mechanical" },
          { name: "Column Erection", wbsCode: "2.2", description: "Distillation towers", estimatedHours: 30000, durationDays: 200, discipline: "mechanical" }
        ],
        risks: [
          { title: "Technology Risk", description: "Scale-up issues", impact: "critical", probability: 2, status: "identified", category: "technical", mitigationPlan: "Proven licensor" }
        ],
        documents: [
          { name: "Heat & Material Balance", description: "H&MB", type: "report" }
        ]
      }
    },
    // 14. Steel Mill Modernization
    {
      name: "Steel Mill Modernization",
      description: "Blast furnace relining and automation upgrade.",
      category: "Industrial",
      isPublic: true,
      metadata: { estimatedDuration: 90, complexity: "high", typicalTeamSize: 200, industry: "Industrial", taskCount: 50 },
      templateData: {
        tasks: [
          { name: "Blow Down", wbsCode: "1", description: "Furnace stop", estimatedHours: 200, durationDays: 2, discipline: "operations" },
          { name: "Demolition", wbsCode: "2", description: "Remove lining", estimatedHours: 5000, durationDays: 20, discipline: "civil" },
          { name: "Relining", wbsCode: "3", description: "Refractory install", estimatedHours: 10000, durationDays: 40, discipline: "civil", predecessors: ["2"] },
          { name: "Blow In", wbsCode: "4", description: "Restart", estimatedHours: 500, durationDays: 5, discipline: "operations", predecessors: ["3"] }
        ],
        risks: [
          { title: "Safety Incident", description: "Confined space entry", impact: "critical", probability: 3, status: "identified", category: "hse", mitigationPlan: "Rescue team on standby" }
        ],
        documents: [
          { name: "Refractory Procedure", description: "Install guide", type: "procedure" }
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
      description: "Development of copper mine including pre-stripping and infrastructure.",
      category: "Mining",
      isPublic: true,
      metadata: { estimatedDuration: 730, complexity: "high", typicalTeamSize: 100, industry: "Mining", taskCount: 35 },
      templateData: {
        tasks: [
          { name: "Exploration", wbsCode: "1", description: "Drilling", estimatedHours: 2000, durationDays: 180, discipline: "geology" },
          { name: "Pre-strip", wbsCode: "2", description: "Overburden removal", estimatedHours: 50000, durationDays: 365, discipline: "mining", predecessors: ["1"] },
          { name: "Haul Roads", wbsCode: "3", description: "Access", estimatedHours: 5000, durationDays: 120, discipline: "civil" },
          { name: "Camp Construction", wbsCode: "4", description: "Housing", estimatedHours: 3000, durationDays: 150, discipline: "construction" }
        ],
        risks: [
          { title: "Ore Grade", description: "Lower than predicted", impact: "high", probability: 3, status: "identified", category: "financial", mitigationPlan: "Geostatistical model" }
        ],
        documents: [
          { name: "Mine Plan", description: "Life of mine", type: "plan" }
        ]
      }
    },
    // 18. Mineral Processing Plant
    {
      name: "Mineral Processing Plant",
      description: "Concentrator plant for copper ore.",
      category: "Mining",
      isPublic: true,
      metadata: { estimatedDuration: 540, complexity: "high", typicalTeamSize: 120, industry: "Mining", taskCount: 40 },
      templateData: {
        tasks: [
          { name: "SAG Mill Install", wbsCode: "1", description: "Grinding", estimatedHours: 5000, durationDays: 180, discipline: "mechanical" },
          { name: "Flotation Cells", wbsCode: "2", description: "Separation", estimatedHours: 4000, durationDays: 150, discipline: "mechanical" },
          { name: "Tailings Dam", wbsCode: "3", description: "Waste storage", estimatedHours: 10000, durationDays: 365, discipline: "civil" }
        ],
        risks: [
          { title: "Tailings Leak", description: "Environmental breach", impact: "critical", probability: 2, status: "identified", category: "environmental", mitigationPlan: "Lined dam" }
        ],
        documents: [
          { name: "Tailings Management Plan", description: "TSF manual", type: "plan" }
        ]
      }
    },
    // 19. Data Center (Tier III)
    {
      name: "Data Center (Tier III)",
      description: "Hyperscale data center facility.",
      category: "Buildings",
      isPublic: true,
      metadata: { estimatedDuration: 400, complexity: "high", typicalTeamSize: 100, industry: "Buildings", taskCount: 45 },
      templateData: {
        tasks: [
          { name: "Core & Shell", wbsCode: "1", description: "Structure", estimatedHours: 5000, durationDays: 180, discipline: "construction" },
          { name: "Electrical", wbsCode: "2", description: "UPS & Generators", estimatedHours: 8000, durationDays: 150, discipline: "electrical", predecessors: ["1"] },
          { name: "Mechanical", wbsCode: "3", description: "Cooling CRAC", estimatedHours: 6000, durationDays: 150, discipline: "mechanical", predecessors: ["1"] },
          { name: "IST", wbsCode: "4", description: "Integrated Systems Test", estimatedHours: 1000, durationDays: 30, discipline: "commissioning", predecessors: ["2", "3"] }
        ],
        risks: [
          { title: "PUE Target", description: "Efficiency miss", impact: "medium", probability: 3, status: "identified", category: "technical", mitigationPlan: "CFD modeling" }
        ],
        documents: [
          { name: "Commissioning Script", description: "Test procedure", type: "procedure" }
        ]
      }
    },
    // 20. Hospital Complex
    {
      name: "Hospital Complex",
      description: "500-bed tertiary care hospital.",
      category: "Buildings",
      isPublic: true,
      metadata: { estimatedDuration: 1095, complexity: "high", typicalTeamSize: 200, industry: "Buildings", taskCount: 60 },
      templateData: {
        tasks: [
          { name: "Structure", wbsCode: "1", description: "Frame", estimatedHours: 20000, durationDays: 365, discipline: "construction" },
          { name: "MEP First Fix", wbsCode: "2", description: "Ducts & pipes", estimatedHours: 15000, durationDays: 200, discipline: "mechanical", predecessors: ["1"] },
          { name: "Medical Gas", wbsCode: "3", description: "O2, Air, Vac", estimatedHours: 3000, durationDays: 120, discipline: "mechanical" },
          { name: "Finishes", wbsCode: "4", description: "Floors & Walls", estimatedHours: 10000, durationDays: 240, discipline: "architectural", predecessors: ["2"] }
        ],
        risks: [
          { title: "Infection Control", description: "Dust during works", impact: "high", probability: 3, status: "identified", category: "quality", mitigationPlan: "ICRA protocols" }
        ],
        documents: [
          { name: "Room Data Sheets", description: "RDS", type: "report" }
        ]
      }
    }
  ];

  for (const t of templates) {
    const templateInput: any = {
      name: t.name,
      description: t.description,
      category: t.category,
      isPublic: t.isPublic,
      metadata: t.metadata,
      templateData: t.templateData,
      organizationId: orgId
    };

    await storage.createProjectTemplate(templateInput);
  }

  console.log(`Seeded ${templates.length} templates.`);
}

seedTemplates()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
