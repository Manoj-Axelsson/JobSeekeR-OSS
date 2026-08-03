export interface RecommendationItem {
  id: string;
  type: "JOB_APPLICATION" | "CV_OPTIMIZATION" | "UPSKILLING" | "RECRUITER_OUTREACH";
  title: string;
  actionText: string;
  rationale: string;
  priorityBadge: string;
  targetJobId?: string;
  targetTab?: "feed" | "tracker" | "profile" | "logs" | "intelligence" | "settings";
  actionType?: "OPEN_JOB_MODAL" | "OPEN_DOC_UPLOADER" | "OPEN_ONBOARDING" | "NAVIGATE_TAB" | "TRIGGER_SCAN";
}

export function generateTodaysRecommendations(jobs: any[] = [], applications: any[] = []): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];

  // 1. Top Matched Job Opportunity Recommendation
  const unapplied = jobs
    .filter((j) => j.status !== "APPLIED")
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  if (unapplied.length > 0) {
    const topMatched = unapplied[0];
    const jobTitle = topMatched.headline || topMatched.title || "Top Position";
    recommendations.push({
      id: "rec_job_top",
      type: "JOB_APPLICATION",
      title: `Apply: ${jobTitle} (${topMatched.company || "Direct Employer"})`,
      actionText: "Open Pitch Strategy & Apply 🚀",
      rationale: `Top position fit evaluated at ${topMatched.matchScore || 0}% match score against your profile.`,
      priorityBadge: "🔥 Top Action Today",
      targetJobId: topMatched.id,
      actionType: "OPEN_JOB_MODAL",
    });
  } else {
    recommendations.push({
      id: "rec_job_scan",
      type: "JOB_APPLICATION",
      title: "Run Daily Swedish Job Market Scan",
      actionText: "Fetch Latest Listings ⚡",
      rationale: "Scan Arbetsförmedlingen JobTech Open Data API for newly published postings today.",
      priorityBadge: "🔥 Top Action Today",
      actionType: "TRIGGER_SCAN",
    });
  }

  // 2. Dynamic Application & CV Intelligence
  const appliedCount = applications.length;
  const savedCount = jobs.filter((j) => j.status === "SAVED").length;

  if (appliedCount > 0) {
    recommendations.push({
      id: "rec_cv_tracker",
      type: "CV_OPTIMIZATION",
      title: `Aktivitetsrapport: ${appliedCount} Positions Logged`,
      actionText: "View Application Tracker 📋",
      rationale: "Review active applications, update response statuses, and export monthly report.",
      priorityBadge: "📄 Application Tracker",
      targetTab: "tracker",
      actionType: "NAVIGATE_TAB",
    });
  } else if (savedCount > 0) {
    recommendations.push({
      id: "rec_cv_saved",
      type: "CV_OPTIMIZATION",
      title: `${savedCount} Saved Positions Ready to Apply`,
      actionText: "Review Saved Positions 📌",
      rationale: "Open your saved target listings and generate tailored cover letter opening hooks.",
      priorityBadge: "📌 Saved Opportunities",
      targetTab: "feed",
      actionType: "NAVIGATE_TAB",
    });
  } else {
    recommendations.push({
      id: "rec_cv_upload",
      type: "CV_OPTIMIZATION",
      title: "Upload Your CV & Certificates",
      actionText: "Upload CV Document 📁",
      rationale: "Upload PDF or DOCX to extract technical competences and boost position match accuracy.",
      priorityBadge: "📄 CV Intelligence",
      actionType: "OPEN_DOC_UPLOADER",
    });
  }

  // 3. Dynamic Skill & Market Insight Recommendation
  const skillCounts: Record<string, number> = {};
  for (const j of jobs) {
    if (Array.isArray(j.missingKeywords)) {
      for (const kw of j.missingKeywords) {
        if (kw && typeof kw === "string") {
          const cleanKw = kw.trim();
          if (cleanKw) {
            skillCounts[cleanKw] = (skillCounts[cleanKw] || 0) + 1;
          }
        }
      }
    }
  }

  const topMissing = Object.entries(skillCounts).sort((a, b) => b[1] - a[1])[0];

  if (topMissing) {
    const [skillName, count] = topMissing;
    recommendations.push({
      id: "rec_skill_demand",
      type: "UPSKILLING",
      title: `High Demand Skill: Add "${skillName}"`,
      actionText: "Update Profile Skills ⚙️",
      rationale: `"${skillName}" is requested in ${count} open position(s) in your target market search.`,
      priorityBadge: "🎓 In-Demand Competence",
      targetTab: "profile",
      actionType: "NAVIGATE_TAB",
    });
  } else {
    recommendations.push({
      id: "rec_skill_profile",
      type: "UPSKILLING",
      title: "Customize Target Roles & Competences",
      actionText: "Configure Profile ⚙️",
      rationale: "Configure target roles, skills, and minimum match score threshold in your profile.",
      priorityBadge: "⚙️ Competence Profile",
      targetTab: "profile",
      actionType: "NAVIGATE_TAB",
    });
  }

  return recommendations;
}
