/**
 * JobSeekR Intelligence Framework v2.0
 * Competency Taxonomy Registry
 */

import { CompetencyNode, CompetencyRelationship } from "./types";

export const COMPETENCY_NODES: Record<string, CompetencyNode> = {
  // Quality Engineering & Operational Excellence Taxonomy
  dmaic: {
    id: "dmaic",
    name: "DMAIC Methodology",
    category: "QUALITY_OPERATIONAL_EXCELLENCE",
    type: "METHODOLOGY",
    aliases: ["dmaic", "define measure analyze improve control"],
    description: "Structured 5-phase problem solving framework for process improvement.",
  },
  lean_six_sigma: {
    id: "lean_six_sigma",
    name: "Lean Six Sigma",
    category: "QUALITY_OPERATIONAL_EXCELLENCE",
    type: "FRAMEWORK",
    aliases: ["lean six sigma", "six sigma", "green belt", "black belt", "lean 6 sigma"],
    description: "Data-driven methodology for eliminating defects and reducing process waste.",
  },
  continuous_improvement: {
    id: "continuous_improvement",
    name: "Continuous Improvement (Kaizen)",
    category: "QUALITY_OPERATIONAL_EXCELLENCE",
    type: "CONCEPT",
    aliases: ["continuous improvement", "kaizen", "ständiga förbättringar", "pdca"],
    description: "Ongoing effort to improve products, services, or processes incrementally.",
  },
  root_cause_analysis: {
    id: "root_cause_analysis",
    name: "Root Cause Analysis (RCA)",
    category: "QUALITY_OPERATIONAL_EXCELLENCE",
    type: "CONCEPT",
    aliases: ["root cause analysis", "rca", "5 whys", "ishikawa", "fishbone", "orsaksanalys"],
    description: "Problem-solving method used to identify the exact root cause of faults or problems.",
  },
  operational_excellence: {
    id: "operational_excellence",
    name: "Operational Excellence",
    category: "QUALITY_OPERATIONAL_EXCELLENCE",
    type: "CONCEPT",
    aliases: ["operational excellence", "opex", "process excellence"],
    description: "Execution of the business strategy more consistently and reliably than competition.",
  },
  data_driven_decision_making: {
    id: "data_driven_decision_making",
    name: "Data-Driven Decision Making",
    category: "QUALITY_OPERATIONAL_EXCELLENCE",
    type: "CONCEPT",
    aliases: ["data driven decision making", "datadriven", "statistical analysis", "analytics"],
    description: "Using facts, metrics, and data to guide strategic business and engineering decisions.",
  },
  spc: {
    id: "spc",
    name: "Statistical Process Control (SPC)",
    category: "QUALITY_OPERATIONAL_EXCELLENCE",
    type: "METHODOLOGY",
    aliases: ["spc", "statistical process control", "control charts"],
    description: "Method of quality control which employs statistical methods to monitor processes.",
  },
  fmea: {
    id: "fmea",
    name: "Failure Mode and Effects Analysis (FMEA)",
    category: "QUALITY_OPERATIONAL_EXCELLENCE",
    type: "METHODOLOGY",
    aliases: ["fmea", "dfmea", "pfmea", "risk assessment"],
    description: "Structured approach to discovering potential failure modes in design or manufacturing.",
  },

  // Systems & Manufacturing Engineering Taxonomy
  systems_engineering: {
    id: "systems_engineering",
    name: "Systems Engineering",
    category: "SYSTEMS_MANUFACTURING",
    type: "CONCEPT",
    aliases: ["systems engineering", "systemteknik", "requirements engineering", "v-model"],
    description: "Interdisciplinary field focusing on how complex engineering projects should be designed and managed.",
  },
  plc_automation: {
    id: "plc_automation",
    name: "PLC & Industrial Automation",
    category: "SYSTEMS_MANUFACTURING",
    type: "TOOL",
    aliases: ["plc", "scada", "industrial automation", "automation engineering", "siemens s7"],
    description: "Programmable logic controllers and industrial process control automation.",
  },
  quality_assurance_manufacturing: {
    id: "quality_assurance_manufacturing",
    name: "Manufacturing Quality Assurance",
    category: "SYSTEMS_MANUFACTURING",
    type: "CONCEPT",
    aliases: ["manufacturing qa", "quality control", "kvalitetssäkring", "iso 9001"],
    description: "Ensuring manufactured products meet quality standards and customer requirements.",
  },

  // Software & Data Engineering Taxonomy
  fullstack_development: {
    id: "fullstack_development",
    name: "Fullstack Software Engineering",
    category: "SOFTWARE_ENGINEERING",
    type: "CONCEPT",
    aliases: ["fullstack", "software engineer", "mjuvaruutvecklare", "typescript", "react", "node.js"],
    description: "End-to-end design, implementation, and maintenance of client and server application systems.",
  },
  quality_assurance_software: {
    id: "quality_assurance_software",
    name: "Software Quality Assurance & Testing",
    category: "SOFTWARE_ENGINEERING",
    type: "CONCEPT",
    aliases: ["software qa", "test automation", "test lead", "unit testing", "integration testing"],
    description: "Automated and manual validation of software functionality, reliability, and security.",
  },
  ci_cd_devops: {
    id: "ci_cd_devops",
    name: "CI/CD & DevOps Engineering",
    category: "SOFTWARE_ENGINEERING",
    type: "METHODOLOGY",
    aliases: ["devops", "ci/cd", "continuous integration", "docker", "kubernetes"],
    description: "Automated software delivery pipelines and cloud infrastructure management.",
  },
};

export const COMPETENCY_RELATIONSHIPS: CompetencyRelationship[] = [
  {
    sourceId: "dmaic",
    targetId: "lean_six_sigma",
    relationship: "IS_CHILD_OF",
    weight: 0.95,
    rationale: "DMAIC is the core 5-phase execution methodology of Lean Six Sigma.",
  },
  {
    sourceId: "lean_six_sigma",
    targetId: "continuous_improvement",
    relationship: "ENABLES",
    weight: 0.90,
    rationale: "Lean Six Sigma provides structured tools to achieve continuous improvement.",
  },
  {
    sourceId: "root_cause_analysis",
    targetId: "dmaic",
    relationship: "IS_CHILD_OF",
    weight: 0.85,
    rationale: "Root Cause Analysis is a critical analytical tool used within the Analyze phase of DMAIC.",
  },
  {
    sourceId: "continuous_improvement",
    targetId: "operational_excellence",
    relationship: "ENABLES",
    weight: 0.90,
    rationale: "Sustained continuous improvement leads directly to enterprise operational excellence.",
  },
  {
    sourceId: "operational_excellence",
    targetId: "data_driven_decision_making",
    relationship: "ENABLES",
    weight: 0.85,
    rationale: "Operational excellence requires data-driven decision making to measure performance.",
  },
  {
    sourceId: "spc",
    targetId: "lean_six_sigma",
    relationship: "IS_CHILD_OF",
    weight: 0.80,
    rationale: "Statistical Process Control provides the mathematical measurement techniques for Six Sigma.",
  },
  {
    sourceId: "fmea",
    targetId: "quality_assurance_manufacturing",
    relationship: "ENABLES",
    weight: 0.85,
    rationale: "FMEA prevents manufacturing defects before they occur in production.",
  },
  {
    sourceId: "quality_assurance_software",
    targetId: "quality_assurance_manufacturing",
    relationship: "EQUIVALENT_TO",
    weight: 0.75,
    rationale: "Quality assurance principles (root cause analysis, defect tracking, test planning) transfer across domains.",
  },
];
