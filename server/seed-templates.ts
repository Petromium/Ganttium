import "dotenv/config";
import { storage } from "./storage";
import { db } from "./db";
import { projectTemplates } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";

export async function seedTemplates() {
  console.log("Seeding project templates...");

  // 1. Clear existing SYSTEM templates (where organizationId is null)
  // This allows us to update templates by just re-running the seed
  try {
    const deleted = await db.delete(projectTemplates)
      .where(isNull(projectTemplates.organizationId))
      .returning();
    console.log(`Cleared ${deleted.length} existing system templates.`);
  } catch (error) {
    console.log("No existing templates to clear or table not found.");
  }

  const templates = [
    {
      name: "Commercial Construction (Office Building)",
      description: "Standard template for a 5-story commercial office building construction project.",
      category: "Construction",
      isPublic: true,
      metadata: {
        estimatedDuration: 365,
        complexity: "high",
        typicalTeamSize: 50,
        industry: "Construction",
        taskCount: 8
      },
      templateData: {
        tasks: [
          { name: "Project Initiation", wbsCode: "1", description: "Kickoff and planning", status: "not-started" },
          { name: "Site Preparation", wbsCode: "2", description: "Clearing and grading", status: "not-started" },
          { name: "Foundation", wbsCode: "3", description: "Pouring concrete foundation", status: "not-started" },
          { name: "Structural Steel", wbsCode: "4", description: "Erecting steel frame", status: "not-started" },
          { name: "Exterior Enclosure", wbsCode: "5", description: "Walls and roofing", status: "not-started" },
          { name: "MEP Rough-in", wbsCode: "6", description: "Mechanical, Electrical, Plumbing", status: "not-started" },
          { name: "Interior Finishes", wbsCode: "7", description: "Drywall, paint, flooring", status: "not-started" },
          { name: "Project Closeout", wbsCode: "8", description: "Final inspections and handover", status: "not-started" }
        ],
        risks: [
          { title: "Weather Delays", description: "Heavy rain impacting foundation work", impact: "high", probability: 4, status: "identified", category: "external" },
          { title: "Material Shortage", description: "Steel delivery delays", impact: "medium", probability: 3, status: "identified", category: "commercial" }
        ]
      }
    },
    {
      name: "Infrastructure (Highway Expansion)",
      description: "Road widening and resurfacing project template.",
      category: "Infrastructure",
      isPublic: true,
      metadata: {
        estimatedDuration: 240,
        complexity: "medium",
        typicalTeamSize: 30,
        industry: "Infrastructure",
        taskCount: 6
      },
      templateData: {
        tasks: [
          { name: "Survey & Design", wbsCode: "1", description: "Topographical survey and engineering design", status: "not-started" },
          { name: "Traffic Management Plan", wbsCode: "2", description: "Detours and safety signage", status: "not-started" },
          { name: "Earthworks", wbsCode: "3", description: "Excavation and embankment", status: "not-started" },
          { name: "Drainage Installation", wbsCode: "4", description: "Culverts and storm drains", status: "not-started" },
          { name: "Paving", wbsCode: "5", description: "Asphalt laying", status: "not-started" },
          { name: "Road Markings & Signage", wbsCode: "6", description: "Final touches", status: "not-started" }
        ],
        risks: [
          { title: "Traffic Accidents", description: "Accidents in work zone", impact: "critical", probability: 2, status: "identified", category: "hse" }
        ]
      }
    },
    {
      name: "Oil & Gas (Onshore Drilling Pad)",
      description: "Construction of a standard onshore drilling pad.",
      category: "Oil & Gas",
      isPublic: true,
      metadata: {
        estimatedDuration: 90,
        complexity: "medium",
        typicalTeamSize: 20,
        industry: "Oil & Gas",
        taskCount: 5
      },
      templateData: {
        tasks: [
          { name: "Site Survey & EIA", wbsCode: "1", description: "Environmental impact assessment", status: "not-started" },
          { name: "Access Road Construction", wbsCode: "2", description: "Building access road", status: "not-started" },
          { name: "Pad Civil Works", wbsCode: "3", description: "Grading and compacting pad", status: "not-started" },
          { name: "Cellar Installation", wbsCode: "4", description: "Installing well cellar", status: "not-started" },
          { name: "Rig Mobilization", wbsCode: "5", description: "Moving rig to site", status: "not-started" }
        ],
        risks: [
          { title: "Environmental Spill", description: "Fuel or chemical leak", impact: "high", probability: 2, status: "identified", category: "hse" }
        ]
      }
    },
    {
      name: "Software Development (SaaS MVP)",
      description: "Agile software development project for a new SaaS product.",
      category: "Technology",
      isPublic: true,
      metadata: {
        estimatedDuration: 120,
        complexity: "medium",
        typicalTeamSize: 10,
        industry: "Technology",
        taskCount: 6
      },
      templateData: {
        tasks: [
          { name: "Requirements Gathering", wbsCode: "1", description: "User stories and specs", status: "not-started" },
          { name: "Design & Prototyping", wbsCode: "2", description: "UI/UX design", status: "not-started" },
          { name: "Backend Development", wbsCode: "3", description: "API and Database", status: "not-started" },
          { name: "Frontend Development", wbsCode: "4", description: "React application", status: "not-started" },
          { name: "Testing & QA", wbsCode: "5", description: "Unit and E2E testing", status: "not-started" },
          { name: "Deployment", wbsCode: "6", description: "Production release", status: "not-started" }
        ],
        risks: [
          { title: "Scope Creep", description: "Features expanding beyond MVP", impact: "medium", probability: 4, status: "identified", category: "project-management" }
        ]
      }
    },
    {
      name: "Solar Farm (50MW)",
      description: "Utility-scale solar photovoltaic power station construction.",
      category: "Energy",
      isPublic: true,
      metadata: {
        estimatedDuration: 180,
        complexity: "medium",
        typicalTeamSize: 40,
        industry: "Energy",
        taskCount: 5
      },
      templateData: {
        tasks: [
          { name: "Land Acquisition & Permitting", wbsCode: "1", description: "Securing land rights", status: "not-started" },
          { name: "Site Grading", wbsCode: "2", description: "Leveling terrain", status: "not-started" },
          { name: "Racking Installation", wbsCode: "3", description: "Mounting structures", status: "not-started" },
          { name: "PV Module Installation", wbsCode: "4", description: "Installing panels", status: "not-started" },
          { name: "Interconnection", wbsCode: "5", description: "Grid connection", status: "not-started" }
        ],
        risks: [
          { title: "Supply Chain Delay", description: "PV module delivery delay", impact: "high", probability: 3, status: "identified", category: "procurement" }
        ]
      }
    },
    {
      name: "Hospital Renovation (Wing B)",
      description: "Renovation of existing hospital wing including HVAC and medical gas systems.",
      category: "Healthcare",
      isPublic: true,
      metadata: {
        estimatedDuration: 150,
        complexity: "high",
        typicalTeamSize: 25,
        industry: "Healthcare",
        taskCount: 5
      },
      templateData: {
        tasks: [
          { name: "Demolition", wbsCode: "1", description: "Removing old interiors", status: "not-started" },
          { name: "Infection Control Setup", wbsCode: "2", description: "Negative pressure barriers", status: "not-started" },
          { name: "MEP Upgrades", wbsCode: "3", description: "Medical gas and HVAC", status: "not-started" },
          { name: "Interior Fit-out", wbsCode: "4", description: "Walls and finishes", status: "not-started" },
          { name: "Commissioning", wbsCode: "5", description: "Testing systems", status: "not-started" }
        ],
        risks: [
          { title: "Infection Containment Breach", description: "Dust affecting patients", impact: "critical", probability: 2, status: "identified", category: "hse" }
        ]
      }
    },
    {
      name: "Water Treatment Plant Expansion",
      description: "Adding capacity to an existing water treatment facility.",
      category: "Utilities",
      isPublic: true,
      metadata: {
        estimatedDuration: 400,
        complexity: "high",
        typicalTeamSize: 35,
        industry: "Utilities",
        taskCount: 5
      },
      templateData: {
        tasks: [
          { name: "Excavation", wbsCode: "1", description: "Digging for new tanks", status: "not-started" },
          { name: "Concrete Works", wbsCode: "2", description: "Pouring tank foundations", status: "not-started" },
          { name: "Piping Installation", wbsCode: "3", description: "Process piping", status: "not-started" },
          { name: "Equipment Installation", wbsCode: "4", description: "Pumps and filters", status: "not-started" },
          { name: "Electrical & SCADA", wbsCode: "5", description: "Controls and power", status: "not-started" }
        ],
        risks: [
          { title: "Groundwater Ingress", description: "Flooding during excavation", impact: "high", probability: 3, status: "identified", category: "construction" }
        ]
      }
    },
    {
      name: "Offshore Wind Farm (Pre-feasibility)",
      description: "Initial study and planning for offshore wind development.",
      category: "Energy",
      isPublic: true,
      metadata: {
        estimatedDuration: 180,
        complexity: "high",
        typicalTeamSize: 15,
        industry: "Energy",
        taskCount: 4
      },
      templateData: {
        tasks: [
          { name: "Resource Assessment", wbsCode: "1", description: "Wind data analysis", status: "not-started" },
          { name: "Geophysical Survey", wbsCode: "2", description: "Seabed mapping", status: "not-started" },
          { name: "Environmental Screening", wbsCode: "3", description: "Impact on marine life", status: "not-started" },
          { name: "Grid Connection Study", wbsCode: "4", description: "Interconnection feasibility", status: "not-started" }
        ],
        risks: [
          { title: "Regulatory Approval", description: "Permit rejection", impact: "critical", probability: 3, status: "identified", category: "legal" }
        ]
      }
    }
  ];

  for (const t of templates) {
    await storage.createProjectTemplate({
        ...t,
        organizationId: null, // System template
        userId: null // System template
    });
  }

  console.log(`Seeded ${templates.length} templates.`);
}

seedTemplates()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
