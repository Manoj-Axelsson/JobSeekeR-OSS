import { fetchLinkedInSwedishJobs } from "../src/lib/services/linkedin";

async function run() {
  console.log("Fetching Swedish jobs from LinkedIn Public Search API...");
  const jobs = await fetchLinkedInSwedishJobs(["fullstack", "systems engineer", "manufacturing engineer"]);
  console.log(`Retrieved ${jobs.length} jobs from LinkedIn:`);
  for (const j of jobs.slice(0, 5)) {
    console.log(`- [${j.company}] ${j.headline} (${j.location}) -> ${j.webpageUrl}`);
  }
}

run();
