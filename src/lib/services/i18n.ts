/**
 * Internationalization (i18n) Translation Service for JobseekeR™
 * Languages: Swedish (Default), English, Norwegian, Danish
 */

export type Language = "sv" | "en" | "no" | "da";

export interface TranslationDictionary {
  appName: string;
  scannerPill: string;
  dailyFeed: string;
  applications: string;
  competenceProfile: string;
  monitorLogs: string;
  runJobScan: string;
  scanning: string;
  cvDocs: string;
  setupWizard: string;
  signIn: string;
  listenAudio: string;
  landingTitle: string;
  landingSubtitle: string;
  landingDescription: string;
  launchDashboard: string;
  onboardingWizard: string;
  multiDomainTitle: string;
  multiDomainDesc: string;
  cvUploadTitle: string;
  cvUploadDesc: string;
  autoRetentionTitle: string;
  autoRetentionDesc: string;
  registerLogin: string;
  uploadFiles: string;
  searchPlaceholder: string;
  statusAll: string;
  statusApplied: string;
  statusInterviewing: string;
  statusOffer: string;
  statusRejected: string;
  minScore: string;
  noJobsFound: string;
  tableTitle: string;
  tableCompany: string;
  tableScore: string;
  tableDate: string;
  tableStatus: string;
  tableActions: string;
  viewDetails: string;
  activityReportBtn: string;
  footerRights: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  sv: {
    appName: "JobseekeR™",
    scannerPill: "Öppen Källkod Jobbskanner",
    dailyFeed: "📌 Dagligt Flöde",
    applications: "📋 Ansökningar",
    competenceProfile: "🎯 Kompetensprofil",
    monitorLogs: "⚡ Skannerloggar",
    runJobScan: "Kör Jobbskanning",
    scanning: "Skannar API...",
    cvDocs: "📄 CV / Dokument",
    setupWizard: "⚙️ Inställningar",
    signIn: "Logga in",
    registerLogin: "👤 Registrera / Logga in",
    uploadFiles: "📁 Ladda upp filer",
    searchPlaceholder: "Sök på jobbtitel, företag, kompetens...",
    statusAll: "Alla Statusar",
    statusApplied: "Ansökt",
    statusInterviewing: "Intervju",
    statusOffer: "Erbjudande 🎉",
    statusRejected: "Avböjd",
    minScore: "Minsta Poäng:",
    noJobsFound: "Inga lediga jobb matchade dina kriterier ännu.",
    tableTitle: "Befattning / Jobbtitel",
    tableCompany: "Företag & Plats",
    tableScore: "Matchning",
    tableDate: "Datum",
    tableStatus: "Status",
    tableActions: "Åtgärder",
    viewDetails: "Visa Analys & Brev 💡",
    activityReportBtn: "🇸🇪 Aktivitetsrapport (Arbetsförmedlingen)",
    listenAudio: "🔊 Lyssna",
    landingTitle: "Din Intelligenta Dagliga Jobbskanner & Kompetensmotor",
    landingSubtitle: "Automatiserad Svensk Jobbskanning med 12 Månaders Datalagring",
    landingDescription: "Utvärderar svenska jobbannonser dagligen kl 12:00 mot dina uppladdade CV:n och kompetensbevis, beräknar viktade poäng och underhåller ett 12-månaders sökarkiv.",
    launchDashboard: "Öppna JobseekeR™ Panelen 🚀",
    onboardingWizard: "⚙️ Starta Guiden",
    multiDomainTitle: "Multi-Domän AI-Matchning",
    multiDomainDesc: "Utvärderar mjukvara, systemteknik, kvalitetssäkring (Six Sigma) och tillverkningsroller med viktade algoritmer.",
    cvUploadTitle: "CV & Kompetensbevis",
    cvUploadDesc: "Ladda upp PDF eller text-CV:n och examen för att automatiskt extrahera tekniska kompetenser.",
    autoRetentionTitle: "12-Månaders Automatisk Datalagring",
    autoRetentionDesc: "Automatisk rensningstjänst raderar sparade annonser äldre än 365 dagar.",
    footerRights: "JobseekeR™ är öppen källkod licensierad under MIT-licensen.",
  },
  en: {
    appName: "JobseekeR™",
    scannerPill: "Open Source SE Job Scanner",
    dailyFeed: "📌 Daily Feed",
    applications: "📋 Applications",
    competenceProfile: "🎯 Competence Profile",
    monitorLogs: "⚡ Monitor Logs",
    runJobScan: "Run Job Scan",
    scanning: "Scanning API...",
    cvDocs: "📄 CV / Docs",
    setupWizard: "⚙️ Setup Wizard",
    signIn: "Sign In",
    registerLogin: "👤 Register Now / Login",
    uploadFiles: "📁 Upload Files",
    searchPlaceholder: "Search job title, company, skills...",
    statusAll: "All Statuses",
    statusApplied: "Applied",
    statusInterviewing: "Interviewing",
    statusOffer: "Offer Received 🎉",
    statusRejected: "Rejected",
    minScore: "Min Score:",
    noJobsFound: "No job postings matched your current search criteria.",
    tableTitle: "Job Title & Position",
    tableCompany: "Company & Location",
    tableScore: "Match Score",
    tableDate: "Date",
    tableStatus: "Status",
    tableActions: "Actions",
    viewDetails: "View Match & Pitch 💡",
    activityReportBtn: "🇸🇪 Activity Report (Arbetsförmedlingen)",
    listenAudio: "🔊 Listen",
    landingTitle: "Your Intelligent Daily Job Scanner & Match Engine",
    landingSubtitle: "Automated Swedish Job Market Scanner with 12-Month Data Retention",
    landingDescription: "Evaluates daily Swedish job postings at 12:00 PM against your uploaded CVs & competence certificates, calculates weighted scores, and maintains an automated 12-month archive.",
    launchDashboard: "Launch JobseekeR™ Dashboard 🚀",
    onboardingWizard: "⚙️ Onboarding Wizard",
    multiDomainTitle: "Multi-Domain AI Matcher",
    multiDomainDesc: "Evaluates Software, Systems Engineering, Quality Assurance (Six Sigma), and Manufacturing roles with weighted domain scoring.",
    cvUploadTitle: "CV & Certificate Extraction",
    cvUploadDesc: "Upload PDF or text CVs and educational diplomas to automatically parse technical competences into your taxonomy.",
    autoRetentionTitle: "12-Month Auto Retention",
    autoRetentionDesc: "Automated data pruning service purges non-saved job ads older than 365 days, keeping a clean 12-month rolling archive.",
    footerRights: "JobseekeR™ is Open Source software released under the MIT License.",
  },
  no: {
    appName: "JobseekeR™",
    scannerPill: "Åpen Kildekode Jobbskanner",
    dailyFeed: "📌 Daglig Strøm",
    applications: "📋 Søknader",
    competenceProfile: "🎯 Kompetanseprofil",
    monitorLogs: "⚡ Skannerlogger",
    runJobScan: "Kjør Jobbskanning",
    scanning: "Skanner API...",
    cvDocs: "📄 CV / Dokumenter",
    setupWizard: "⚙️ Innstillinger",
    signIn: "Logg inn",
    registerLogin: "👤 Registrer / Logg inn",
    uploadFiles: "📁 Last opp filer",
    searchPlaceholder: "Søk etter jobbtittel, bedrift, kompetanse...",
    statusAll: "Alle Statuser",
    statusApplied: "Søkt",
    statusInterviewing: "Intervju",
    statusOffer: "Tilbud 🎉",
    statusRejected: "Avslått",
    minScore: "Minimum Poeng:",
    noJobsFound: "Ingen ledige jobber matchet dine kriterier ennå.",
    tableTitle: "Stillingstittel",
    tableCompany: "Bedrift & Sted",
    tableScore: "Matchpoeng",
    tableDate: "Dato",
    tableStatus: "Status",
    tableActions: "Handlinger",
    viewDetails: "Vis Analyse & Brev 💡",
    activityReportBtn: "🇸🇪 Aktivitetsrapport (Arbetsförmedlingen)",
    listenAudio: "🔊 Lytt",
    landingTitle: "Din Intelligente Daglige Jobbskanner & Matchmotor",
    landingSubtitle: "Automatisert Svensk Jobbskanning med 12 Måneders Datalagring",
    landingDescription: "Evaluerer svenske jobbannonser daglig kl 12:00 mot dine opplastede CV-er og kompetansebevis, beregner vektede poeng og vedlikeholder et 12-måneders arkiv.",
    launchDashboard: "Åpne JobseekeR™ Dashbord 🚀",
    onboardingWizard: "⚙️ Start Veiviser",
    multiDomainTitle: "Multi-Domene AI-Matching",
    multiDomainDesc: "Evaluerer programvare, systemteknikk, kvalitetssikring (Six Sigma) og produksjonsroller med vektede algoritmer.",
    cvUploadTitle: "CV & Kompetanseuthenting",
    cvUploadDesc: "Last opp PDF eller tekst-CV-er og vitnemål for automatisk å hente ut teknisk kompetanse.",
    autoRetentionTitle: "12-Måneders Automatisk Lagring",
    autoRetentionDesc: "Automatisk oppryddingstjeneste sletter annonser eldre enn 365 dager.",
    footerRights: "JobseekeR™ er åpen kildekode lisensiert under MIT-lisensen.",
  },
  da: {
    appName: "JobseekeR™",
    scannerPill: "Open Source Jobscanner",
    dailyFeed: "📌 Dagligt Feed",
    applications: "📋 Ansøgninger",
    competenceProfile: "🎯 Kompetenceprofil",
    monitorLogs: "⚡ Scannerlogs",
    runJobScan: "Kør Jobscanning",
    scanning: "Scanner API...",
    cvDocs: "📄 CV / Dokumenter",
    setupWizard: "⚙️ Indstillinger",
    signIn: "Log ind",
    registerLogin: "👤 Registrer / Log ind",
    uploadFiles: "📁 Upload filer",
    searchPlaceholder: "Søg efter jobtitel, virksomhed, kompetencer...",
    statusAll: "Alle Statusser",
    statusApplied: "Ansøgt",
    statusInterviewing: "Samtale",
    statusOffer: "Tilbud 🎉",
    statusRejected: "Afvist",
    minScore: "Minimum Score:",
    noJobsFound: "Ingen ledige job matchede dine kriterier endnu.",
    tableTitle: "Stillingstitel",
    tableCompany: "Virksomhed & Sted",
    tableScore: "Matchscore",
    tableDate: "Dato",
    tableStatus: "Status",
    tableActions: "Handlinger",
    viewDetails: "Vis Analyse & Brev 💡",
    activityReportBtn: "🇸🇪 Aktivitetsrapport (Arbetsförmedlingen)",
    listenAudio: "🔊 Lyt",
    landingTitle: "Din Intelligente Daglige Jobscanner & Matchmotor",
    landingSubtitle: "Automatiseret Svensk Jobscanning med 12 Måneders Dataopbevaring",
    landingDescription: "Evaluerer svenske jobopslag dagligt kl 12:00 mod dine uploadede CV'er og kompetencebeviser, beregner vægtede scores og vedligeholder et 12-måneders arkiv.",
    launchDashboard: "Åbn JobseekeR™ Dashboard 🚀",
    onboardingWizard: "⚙️ Start Guiden",
    multiDomainTitle: "Multi-Domæne AI-Matching",
    multiDomainDesc: "Evaluerer software, systemteknik, kvalitetssikring (Six Sigma) og produktionsroller med vægtede algoritmer.",
    cvUploadTitle: "CV & Kompetenceudtræk",
    cvUploadDesc: "Upload PDF eller tekst-CV'er og eksamensbeviser for automatisk at udtrække tekniske kompetencer.",
    autoRetentionTitle: "12-Måneders Automatisk Opbevaring",
    autoRetentionDesc: "Automatisk oprydningstjeneste sletter opslag ældre end 365 dage.",
    footerRights: "JobseekeR™ er open source-software licenseret under MIT-licensen.",
  },
};

export const languageNames: Record<Language, { name: string; flag: string }> = {
  sv: { name: "Svenska", flag: "🇸🇪" },
  en: { name: "English", flag: "🇬🇧" },
  no: { name: "Norsk", flag: "🇳🇴" },
  da: { name: "Dansk", flag: "🇩🇰" },
};
