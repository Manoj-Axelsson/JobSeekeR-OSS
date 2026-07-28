import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const defaultProfile = {
    id: "user_manoj",
    name: "Manoj John Axelsson",
    headline: "Systems Engineer | Fullstack Developer | Manufacturing & Quality Improvement",
    location: "Sweden (Stockholm / Linköping / Gothenburg / Remote)",
    languages: "English (fluent), Swedish (fluent), Malayalam (native)",
    targetRoles: JSON.stringify([
      "Fullstack Developer",
      "React / Next.js Engineer",
      "Systems Engineer",
      "Requirements Engineer",
      "Manufacturing Engineer",
      "Production Developer",
      "Automation & Digitalization Engineer",
      "Quality Assurance & Verification Engineer",
      "Technical Project Coordinator",
      "Business & System Analyst",
    ]),
    skills: JSON.stringify({
      software: [
        "React", "TypeScript", "Next.js", "Node.js", "Express", "PostgreSQL", 
        "SQL", "REST APIs", "Git", "GitHub", "Tailwind CSS", "Vercel", "Render", "Telemetry"
      ],
      systems: [
        "Systems Thinking", "Systems Engineering", "Software Architecture", 
        "Requirements Engineering", "Validation & Verification", "Technical Documentation", 
        "Documentation-as-Architecture", "PLM"
      ],
      quality: [
        "Six Sigma Green Belt", "DMAIC", "FMEA", "Poka-Yoke", "Root Cause Analysis", 
        "Quality Assurance", "Process Optimization", "Standard Work", "Continuous Improvement"
      ],
      industrial: [
        "Manufacturing Engineering", "Production Development", "Lean Manufacturing", 
        "Industrial Digitalization", "Automation", "CNC Programming", "CAD/CAM", "Preventive Maintenance"
      ]
    }),
    minMatchScore: 45,
  };

  await prisma.userProfile.upsert({
    where: { id: "user_manoj" },
    update: defaultProfile,
    create: defaultProfile,
  });

  console.log("Database seeded successfully with Manoj's profile!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
