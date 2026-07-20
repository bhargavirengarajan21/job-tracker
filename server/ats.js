const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('./auth');

const router = express.Router();

const skillsDir = path.join(__dirname, 'skills');
function loadSkill(name) {
  try {
    return fs.readFileSync(path.join(skillsDir, `${name}.md`), 'utf-8');
  } catch { return ''; }
}
const SKILL_ATS = loadSkill('resume-ats-optimizer');
const SKILL_JD = loadSkill('job-description-analyzer');
const SKILL_FORMAT = loadSkill('resume-formatter');
const SKILL_QUANTIFY = loadSkill('resume-quantifier');
const SKILL_RECRUITER = loadSkill('recruiter-skills');

const upload = multer({
  dest: path.join(__dirname, 'uploads/'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF and DOCX files are allowed'));
  }
});

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const Anthropic = require('@anthropic-ai/sdk');
  return new Anthropic({ apiKey });
}

// Parse model JSON tolerantly. Truncated output (hit max_tokens) is the #1 cause of
// keywords silently disappearing — the raw parse throws and the caller falls back to a
// weak regex extractor with no soft skills. This repairs trailing commas, closes a dangling
// string, and balances unclosed brackets so a truncated response still yields most keywords.
function parseJsonLoose(text) {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/);
  const raw = match ? match[0] : text.trim();
  try { return JSON.parse(raw); } catch { /* repair below */ }

  let fixed = raw.replace(/,\s*([}\]])/g, '$1');       // trailing commas
  if ((fixed.match(/"/g) || []).length % 2 !== 0) fixed += '"'; // dangling string
  const open = (fixed.match(/\[/g) || []).length, closeArr = (fixed.match(/\]/g) || []).length;
  const openObj = (fixed.match(/\{/g) || []).length, closeObj = (fixed.match(/\}/g) || []).length;
  fixed += ']'.repeat(Math.max(0, open - closeArr));
  fixed += '}'.repeat(Math.max(0, openObj - closeObj));
  try { return JSON.parse(fixed); } catch { /* last resort below */ }

  // Drop everything after the last complete top-level entry and re-close.
  try {
    const cut = fixed.lastIndexOf('},');
    if (cut > 0) {
      let salvage = raw.slice(0, cut + 1).replace(/,\s*$/, '');
      salvage += ']'.repeat(Math.max(0, open - closeArr)) + '}'.repeat(Math.max(0, openObj - closeObj));
      return JSON.parse(salvage);
    }
  } catch { /* give up */ }
  return null;
}

// --- Traditional ATS: AI-powered keyword extraction with categorization ---

async function extractATSKeywords(jobDescription) {
  const client = getAnthropicClient();
  if (!client) return null;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    messages: [{
      role: 'user',
      content: `You are an ATS (Applicant Tracking System) parser. Parse this job description exactly how a real ATS like Taleo, Workday, iCIMS, or Greenhouse would.

Use these skill guides as your knowledge base:
<skill name="resume-ats-optimizer">
${SKILL_ATS.substring(0, 2000)}
</skill>
<skill name="job-description-analyzer">
${SKILL_JD.substring(0, 2000)}
</skill>

Return ONLY valid JSON (no markdown). Extract keywords into categories with priority levels.

{
  "hardSkills": [
    {"keyword": "exact term from JD", "type": "tech|concept", "priority": "required|preferred", "variations": ["abbreviation", "synonym", "alternate spelling"], "indicators": ["concepts only: action/evidence phrases a resume uses to demonstrate this"]}
  ],
  "softSkills": [
    {"keyword": "the EXACT action phrase as written in the JD, verbatim (e.g. \"take ownership\", \"drive results\", \"attention to detail\", \"cross-functional collaboration\") — do NOT shorten it to a single generic noun", "priority": "required|preferred", "indicators": ["action verbs and evidence phrases that PROVE this behaviour on a resume"]}
  ],
  "tools": [
    {"keyword": "exact tool/platform name", "priority": "required|preferred", "variations": ["abbreviation"]}
  ],
  "education": [
    {"keyword": "degree or cert", "priority": "required|preferred", "variations": []}
  ],
  "experience": [
    {"keyword": "years or domain experience requirement", "priority": "required|preferred", "variations": []}
  ],
  "certifications": [
    {"keyword": "cert name", "priority": "required|preferred", "variations": ["abbreviation"]}
  ]
}

RULES — parse like a REAL ATS:
- DECOMPOSE long descriptive phrases into the ATOMIC keywords a real ATS actually indexes. An original ATS is a literal keyword/boolean search engine — it does NOT store or search whole sentences. A recruiter never configures it to search for "scalable resilient cloud-native data pipelines" verbatim; they search the atoms. So break requirement phrases into their smallest independently-searchable units:
  - "scalable resilient cloud-native data pipelines" → "cloud-native", "data pipelines", "scalable", "resilient" (as separate hardSkills entries)
  - "event-based integration patterns" → "event-driven" (variations: "event-based", "event driven"), "integration", "pub/sub"
  - "container orchestration systems" → "container orchestration" (variations: "Kubernetes", "K8s", "ECS")
  - "adaptability with GenAI tools" → tool "GenAI" (variations: "generative AI", "LLM", "GPT"); softSkill "adaptability"
  - "frontend development experience" → "frontend" (variations: "front-end", "front end"); plus any named frameworks
  - "cloud-native applications experience" → "cloud-native"
  Each atom must be a term that could literally appear in a resume. NEVER emit a full descriptive sentence as a single keyword — it will never match a real ATS.
- Extract the EXACT words/phrases used in the job description, not synonyms you invent
- "required" = appears under Required/Must Have/Minimum Qualifications sections, or uses words like "must", "required", "mandatory"
- "preferred" = appears under Preferred/Nice to Have/Bonus/Additional sections, or uses "preferred", "desired", "plus", "ideally"
- For each keyword, list known abbreviations and common variations:
  - "JavaScript" → ["JS"], "TypeScript" → ["TS"], "Amazon Web Services" → ["AWS"]
  - "C++" → ["Cpp"], "C#" → ["C Sharp", "CSharp", ".NET"]
  - "Kubernetes" → ["K8s", "k8s"], "CI/CD" → ["CICD", "continuous integration", "continuous deployment"]
  - "Machine Learning" → ["ML"], "Artificial Intelligence" → ["AI"]
  - "PostgreSQL" → ["Postgres"], "MongoDB" → ["Mongo"]
  - "Bachelor's" → ["BS", "B.S.", "BSc", "Bachelor"], "Master's" → ["MS", "M.S.", "MSc", "Master"]
- Include years of experience as keywords: "5+ years" → variations ["5 years", "five years"]
- Frequency matters: if a term appears 3+ times in the JD, it is "required" regardless of section
- Do NOT include company name, location, salary, EEO boilerplate, or generic phrases like "team player"

HOW TO MATCH — set the right signals per keyword TYPE (this controls how the resume is scored):
- HARD SKILLS — classify each with "type":
  - "tech": a concrete tech stack — language, framework, library, platform, database, service (React, Python, AWS, PostgreSQL, Kubernetes). Matched LITERALLY against the resume. Leave "indicators" empty.
  - "concept": a methodology, practice, or domain, NOT a named tool (distributed systems, system design, scalability, object-oriented design, data modeling, microservices, test-driven development, CI/CD practices). A resume rarely writes these words verbatim — it demonstrates them. Provide 3-6 "indicators": the concrete action/evidence phrases that prove it (e.g. "scalability" → ["horizontal scaling", "sharding", "load balancing", "handled X requests", "reduced latency"]).
- SOFT SKILLS — do NOT rely on the literal noun; real resumes almost never write "collaboration" or "leadership". Provide up to 3 "indicators": specific ACTION verbs that demonstrate the trait, e.g.
  - "collaboration" → ["partnered with", "cross-functional", "coordinated"]
  - "leadership" → ["led", "mentored", "spearheaded"]
  - Indicators must be specific action words — never generic filler.

COMPLETENESS & SIZE:
- Be EXHAUSTIVE — extract EVERY distinct hard skill, tool, and soft skill named in the JD. Do not stop early or summarize. A missing keyword means the candidate is scored wrong.
- Every soft skill mentioned or clearly implied (leadership, communication, collaboration, problem-solving, ownership, mentoring, adaptability, attention to detail, etc.) MUST appear under softSkills.
- To stay within budget, keep "variations" and "indicators" to at most 3 items each. Prefer covering MORE keywords over long variation lists.

Job Description:
${jobDescription.substring(0, 12000)}`
    }]
  });

  const parsed = parseJsonLoose(message.content[0].text);
  if (!parsed) console.error('ATS keyword JSON parse failed (likely truncation)');
  return parsed;
}

// --- ATS: Keyword matching with variations ---
//
// Two scores are always produced:
//   • strictScore (the "Original ATS Score") — LITERAL keyword matching only, exactly like a
//     real Workday / Greenhouse / Taleo ATS. If the exact term (or a known variation) isn't in
//     the resume text, it's MISSING. No inference. This is the honest gate number.
//   • demonstratedScore — literal PLUS behavioral evidence (soft skills / concepts proven via
//     action words). The gap between the two is what you'd gain by adding the literal keywords.
//
// PURE_ATS_MODE = true collapses everything to the literal score only (no demonstrated layer).
// Kept false so BOTH scores show; the strict score already gives true pure-Workday behaviour.
const PURE_ATS_MODE = false;

// True when an item should be matched by reflected behaviour rather than an exact term.
// In pure ATS mode nothing is behavioral — everything must appear literally.
function isBehavioralItem(item, category) {
  if (PURE_ATS_MODE) return false;
  if (category === 'softSkills') return true;
  if (category === 'hardSkills' && item.type === 'concept') return true;
  return false;
}

// Built-in fallback indicators for common soft skills & concept skills. The AI extractor
// is supposed to emit `indicators` per behavioral item, but it does so inconsistently — when
// it omits them, behavioral matching never fires and the tool degrades to a plain literal ATS.
// Keyed by a substring of the skill name → the action/evidence phrases that PROVE it on a resume.
const DEFAULT_INDICATORS = {
  'communication':      ['presented', 'authored', 'documented', 'facilitated', 'briefed', 'negotiated', 'liaised', 'wrote'],
  'collaboration':      ['partnered with', 'cross-functional', 'coordinated', 'worked closely', 'stakeholders', 'paired', 'collaborated'],
  'teamwork':           ['partnered with', 'cross-functional', 'coordinated', 'collaborated', 'contributed', 'supported'],
  'leadership':         ['led', 'mentored', 'spearheaded', 'managed a team', 'drove', 'owned', 'directed', 'championed'],
  'mentoring':          ['mentored', 'coached', 'trained', 'onboarded', 'guided', 'advised'],
  'ownership':          ['owned', 'drove', 'led', 'spearheaded', 'accountable for', 'end-to-end'],
  'problem solving':    ['resolved', 'diagnosed', 'troubleshot', 'debugged', 'root-caused', 'optimized', 'mitigated'],
  'problem-solving':    ['resolved', 'diagnosed', 'troubleshot', 'debugged', 'root-caused', 'optimized', 'mitigated'],
  'analytical':         ['analyzed', 'evaluated', 'assessed', 'modeled', 'forecasted', 'interpreted'],
  'critical thinking':  ['evaluated', 'assessed', 'analyzed', 'investigated', 'synthesized'],
  'adaptability':       ['pivoted', 'adapted', 'transitioned', 'revamped', 'restructured', 'adjusted'],
  'flexibility':        ['pivoted', 'adapted', 'transitioned', 'adjusted', 'restructured'],
  'initiative':         ['initiated', 'launched', 'established', 'proposed', 'drove', 'pioneered', 'championed'],
  'creativity':         ['pioneered', 'innovated', 'conceptualized', 'designed', 'introduced', 'prototyped'],
  'innovation':         ['pioneered', 'innovated', 'launched', 'introduced', 'transformed', 'reimagined'],
  'attention to detail':['audited', 'validated', 'verified', 'reviewed', 'ensured', 'inspected'],
  'time management':    ['prioritized', 'delivered', 'scheduled', 'expedited', 'met deadlines', 'shipped on time'],
  'negotiation':        ['negotiated', 'mediated', 'brokered', 'secured', 'persuaded'],
  // concept-type hard skills
  'system design':      ['designed', 'architected', 'distributed', 'scalable', 'high-availability', 'microservices', 'trade-offs'],
  'scalability':        ['horizontal scaling', 'sharding', 'load balancing', 'throughput', 'reduced latency', 'high-availability'],
  'scalable':           ['horizontal scaling', 'sharding', 'load balancing', 'throughput', 'reduced latency', 'high-availability'],
  'distributed systems':['distributed', 'sharding', 'replication', 'consensus', 'fault-tolerant', 'eventual consistency'],
  'microservices':      ['microservice', 'service-oriented', 'decoupled services', 'api gateway', 'containerized'],
  'cloud-native':       ['containerized', 'kubernetes', 'serverless', 'microservices', 'autoscaling', 'docker'],
  'event-driven':       ['event-driven', 'event-based', 'pub/sub', 'kafka', 'message queue', 'streaming'],
  'ci/cd':              ['ci/cd', 'continuous integration', 'continuous deployment', 'pipeline', 'automated deployment', 'jenkins', 'github actions'],
  'test-driven':        ['unit tests', 'test coverage', 'tdd', 'automated testing', 'integration tests'],
  'data pipelines':     ['etl', 'data pipeline', 'ingestion', 'airflow', 'batch processing', 'streaming'],
  'resilient':          ['fault-tolerant', 'retry', 'circuit breaker', 'failover', 'high-availability', 'graceful degradation'],
};

function defaultIndicators(keyword) {
  const key = String(keyword || '').toLowerCase();
  for (const [pattern, verbs] of Object.entries(DEFAULT_INDICATORS)) {
    if (key.includes(pattern) || pattern.includes(key)) return verbs;
  }
  return [];
}

// Literal terms are direct evidence (the term itself / known variations).
// Indicators are action/evidence words that demonstrate a behaviour or concept —
// only used for behavioral items. Fall back to the built-in map when the AI omitted them.
function matchTerms(item, category) {
  const literal = [item.keyword, ...(item.variations || [])].filter(Boolean);
  let indicators = [];
  if (isBehavioralItem(item, category)) {
    indicators = (item.indicators && item.indicators.length) ? item.indicators : defaultIndicators(item.keyword);
  }
  return { literal, indicators };
}

function termRegex(term, flags) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, flags);
}

function atsMatch(resumeText, item, category) {
  const { literal, indicators } = matchTerms(item, category);

  // 1. Direct evidence: the exact term or a known variation is present.
  for (const term of literal) {
    if (termRegex(term, 'i').test(resumeText)) {
      return { matched: true, matchedAs: term, via: 'literal' };
    }
  }

  // 2. Behavioral evidence: the resume reflects the action/behaviour even though
  //    the literal skill word is absent (e.g. "led a cross-functional team" proves
  //    "collaboration"; "designed for horizontal scaling" proves "scalability").
  for (const term of indicators) {
    if (termRegex(term, 'i').test(resumeText)) {
      return { matched: true, matchedAs: term, via: 'behavioral' };
    }
  }

  // 3. Loose substring fallback for multi-word literal phrases.
  const lower = resumeText.toLowerCase();
  const loose = literal.find(t => lower.includes(t.toLowerCase()));
  if (loose) return { matched: true, matchedAs: loose, via: 'literal' };

  return { matched: false, matchedAs: null, via: null };
}

function countOccurrences(resumeText, item, category) {
  const { literal, indicators } = matchTerms(item, category);
  let count = 0;
  for (const term of [...literal, ...indicators]) {
    const matches = resumeText.match(termRegex(term, 'gi'));
    if (matches) count += matches.length;
  }
  return count;
}

// --- Traditional ATS: Weighted scoring ---

// Two scores, because a REAL/original ATS and a smart reviewer disagree:
//   • strictScore ("Original ATS Score") — literal keyword hits ONLY. This is what a
//     dumb ATS (Taleo/Workday/etc.) actually computes: it greps the resume for the exact
//     term/variation and gives ZERO credit for a skill you merely demonstrate. This is the
//     honest, headline number a candidate is judged on.
//   • demonstratedScore — literal hits PLUS behavioral/implied evidence (soft skills &
//     concepts proven via action words). This is the "true" strength a human would see.
// Anything matched only behaviorally is NOT counted by the strict score; instead it lands
// in demonstratedMissing: "you clearly demonstrate this, but the literal keyword is absent —
// add it, or a strict ATS will drop you."
function atsScore(resumeText, atsKeywords) {
  const categories = ['hardSkills', 'softSkills', 'tools', 'education', 'experience', 'certifications'];
  const categoryWeights = {
    hardSkills: 3,
    tools: 3,
    experience: 2.5,
    education: 2,
    certifications: 2,
    softSkills: 1
  };
  const priorityMultiplier = { required: 2, preferred: 1 };

  const results = {
    matched: [],            // literal hits only (what the strict ATS credits)
    demonstratedMissing: [], // implied/behavioral hits — keyword absent, "add it" risk list
    missing: [],            // no evidence at all
    categoryScores: {},
    strictWeightedScore: 0,     // literal only
    demonstratedWeightedScore: 0, // literal + behavioral
    maxWeightedScore: 0
  };

  for (const category of categories) {
    const items = atsKeywords[category] || [];
    if (items.length === 0) continue;

    const catResult = { matched: [], demonstrated: [], missing: [], strictScore: 0, score: 0, maxScore: 0 };

    for (const item of items) {
      const weight = categoryWeights[category] * priorityMultiplier[item.priority || 'preferred'];
      catResult.maxScore += weight;
      results.maxWeightedScore += weight;

      const match = atsMatch(resumeText, item, category);
      const count = match.matched ? countOccurrences(resumeText, item, category) : 0;

      const entry = {
        keyword: item.keyword,
        category,
        priority: item.priority,
        matchedAs: match.matchedAs,
        matchVia: match.via,
        occurrences: count,
        weight
      };

      if (match.matched && match.via === 'literal') {
        // Literal hit — credited by BOTH scores.
        catResult.matched.push(entry);
        catResult.strictScore += weight;
        catResult.score += weight;
        results.strictWeightedScore += weight;
        results.demonstratedWeightedScore += weight;
        results.matched.push(entry);
      } else if (match.matched && match.via === 'behavioral') {
        // Implied/demonstrated — credited by demonstrated score only; a strict ATS misses it.
        catResult.demonstrated.push(entry);
        catResult.score += weight;
        results.demonstratedWeightedScore += weight;
        results.demonstratedMissing.push(entry);
      } else {
        catResult.missing.push(entry);
        results.missing.push(entry);
      }
    }

    // Category % reported on the strict (literal) basis — that's what an ATS gate uses.
    catResult.percentage = catResult.maxScore > 0 ? Math.round((catResult.strictScore / catResult.maxScore) * 100) : 0;
    catResult.demonstratedPercentage = catResult.maxScore > 0 ? Math.round((catResult.score / catResult.maxScore) * 100) : 0;
    results.categoryScores[category] = catResult;
  }

  results.strictScore = results.maxWeightedScore > 0
    ? Math.round((results.strictWeightedScore / results.maxWeightedScore) * 100)
    : 0;
  results.demonstratedScore = results.maxWeightedScore > 0
    ? Math.round((results.demonstratedWeightedScore / results.maxWeightedScore) * 100)
    : 0;
  // Headline score = strict/original ATS number (the one you're actually gated on).
  results.overallScore = results.strictScore;

  // Required keywords the STRICT ATS won't find literally = fully-missing required
  // PLUS required skills you only demonstrate (keyword absent). A real ATS flags all of these.
  const requiredMissing = [
    ...results.missing.filter(m => m.priority === 'required'),
    ...results.demonstratedMissing.filter(m => m.priority === 'required')
  ];
  results.requiredMissing = requiredMissing;

  const totalRequired = results.matched.filter(m => m.priority === 'required').length + requiredMissing.length;
  results.autoReject = totalRequired > 0 && (requiredMissing.length / totalRequired) >= 0.3;

  return results;
}

// --- Fallback for when AI is unavailable ---

function extractKeywordsFallback(jobDescription) {
  const text = jobDescription.toLowerCase();
  const techPattern = /\b(?:python|java|javascript|typescript|react|angular|vue|node\.?js|express|django|flask|spring|aws|azure|gcp|docker|kubernetes|k8s|sql|nosql|mongodb|postgresql|mysql|redis|kafka|rabbitmq|git|ci\/cd|jenkins|terraform|ansible|graphql|rest\s*api|api|microservices|event[- ]driven|serverless|lambda|agile|scrum|machine learning|deep learning|nlp|genai|llm|tensorflow|pytorch|pandas|numpy|scikit-learn|tableau|power bi|excel|hadoop|spark|airflow|etl|data pipelines?|snowflake|databricks|html|css|webpack|next\.js|flutter|react native|swift|kotlin|go|golang|rust|c\+\+|c#|\.net|ruby|rails|php|linux|bash|jira|github|gitlab|datadog|prometheus|grafana|distributed systems|system design|scalability|data structures|algorithms|cloud computing|cloud[- ]native|observability|devops|object[- ]oriented|test[- ]driven|tdd)\b/gi;
  // Soft skills a real ATS is also configured to search literally.
  const softPattern = /\b(?:leadership|communication|collaboration|teamwork|problem[- ]solving|ownership|mentoring|mentorship|adaptability|flexibility|attention to detail|time management|critical thinking|analytical|creativity|innovation|initiative|negotiation|stakeholder management|cross[- ]functional)\b/gi;
  const seen = new Set();
  const push = (arr, cat) => {
    for (const m of (arr || [])) {
      const lower = m.trim().toLowerCase();
      if (!seen.has(lower)) { seen.add(lower); keywords.push({ keyword: m.trim(), category: cat }); }
    }
  };
  const keywords = [];
  push(text.match(techPattern), 'hardSkills');
  push(text.match(softPattern), 'softSkills');
  return keywords.slice(0, 60);
}

function fallbackScore(resumeText, keywords) {
  // Accept both the new {keyword, category} shape and plain strings.
  const norm = keywords.map(k => (typeof k === 'string')
    ? { keyword: k, category: 'hardSkills' }
    : { keyword: k.keyword, category: k.category || 'hardSkills' });

  const found = [], missing = [];
  for (const kw of norm) {
    const priority = kw.category === 'softSkills' ? 'preferred' : 'required';
    const entry = { keyword: kw.keyword, category: kw.category, priority };
    if (resumeText.toLowerCase().includes(kw.keyword.toLowerCase())) {
      found.push({ ...entry, matchedAs: kw.keyword, matchVia: 'literal', occurrences: 1, weight: 1 });
    } else {
      missing.push({ ...entry, matchedAs: null, occurrences: 0, weight: 1 });
    }
  }
  const strict = norm.length > 0 ? Math.round((found.length / norm.length) * 100) : 0;
  return {
    overallScore: strict,
    strictScore: strict,
    demonstratedScore: strict, // fallback does literal-only matching, so both scores are equal
    matched: found,
    demonstratedMissing: [],
    missing,
    categoryScores: {},
    requiredMissing: missing.filter(m => m.priority === 'required'),
    autoReject: false
  };
}

// --- File extraction ---

async function extractTextFromFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } else if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  throw new Error('Unsupported file format');
}

// --- Recruiter 6-second screen ---

async function recruiterScreen(resumeText, jobDescription) {
  const client = getAnthropicClient();
  if (!client) return null;

  const message = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 8192,
    messages: [{
      role: 'user',
      content: `You are a brutally honest, extremely picky tech recruiter AND a professional resume editor. Scrutinize EVERY line in this resume against this specific job.

Use these skill guides as your expert knowledge. The recruiter-skills guide is your PRIMARY evaluation methodology — apply its criteria (evidence-based reading, exact tech-stack frequency analysis, "never infer missing information — state 'not evidenced'", exact-phrase keyword matching where synonyms don't count):
<skill name="recruiter-skills">
${SKILL_RECRUITER.substring(0, 8000)}
</skill>
<skill name="resume-formatter">
${SKILL_FORMAT.substring(0, 2000)}
</skill>
<skill name="resume-quantifier">
${SKILL_QUANTIFY.substring(0, 2000)}
</skill>
<skill name="resume-ats-optimizer">
${SKILL_ATS.substring(0, 1500)}
</skill>

CRITICAL: Return ONLY valid JSON. No markdown, no backticks. Keep "line" values SHORT (truncate to ~60 chars max). Keep "reason" to ONE sentence.

{
  "verdict": "pass|maybe|reject",
  "verdictReason": "One blunt sentence",
  "firstImpressions": ["First thing noticed", "Second", "Third"],
  "titleMatch": {"score": 1, "comment": "..."},
  "experienceMatch": {"score": 1, "comment": "..."},
  "educationMatch": {"score": 1, "comment": "..."},
  "impactCheck": {"score": 1, "comment": "..."},
  "readability": {"score": 1, "comment": "..."},
  "formattingScore": {"score": 1, "comment": "Overall formatting and visual design assessment"},
  "grammarErrors": [
    {"text": "Exact text with error", "issue": "What's wrong", "fix": "Corrected version"}
  ],
  "formattingIssues": [
    {"issue": "Description of formatting/spacing/design problem", "location": "Where in resume", "fix": "How to fix it"}
  ],
  "lineByLineAudit": [
    {"line": "Short excerpt...", "relevance": "high|medium|low|none", "verdict": "keep|rewrite|remove", "reason": "One sentence."}
  ],
  "irrelevantSkills": [
    {"skill": "Name", "reason": "One sentence."}
  ],
  "removeToSaveSpace": ["Line to cut"],
  "topSuggestions": ["Fix 1", "Fix 2", "Fix 3"]
}

RULES:
- Audit EVERY bullet, skill, experience line, education detail, project, certification
- Flag: generic filler, vague descriptions, unrelated domain experience, outdated tech, soft skill fluff, redundant lines
- If a line mentions relevant tech in a trivial context: "rewrite" not "keep"
- When in doubt, flag it — better to over-flag than miss filler
- Cover minimum 15+ lines from the resume
- Be HARSH. Every irrelevant line wastes the recruiter's 6-second window

GRAMMAR RULES — catch ALL of these:
- Spelling errors, typos
- Subject-verb agreement errors
- Tense inconsistency (mixing past/present tense within same section)
- Missing articles (a, an, the) or incorrect articles
- Run-on sentences, comma splices
- Incorrect prepositions
- Missing Oxford commas in lists
- Capitalization errors
- Inconsistent punctuation (some bullets end with period, some don't)

FORMATTING/DESIGN RULES — flag ALL of these:
- Inconsistent spacing (extra spaces, uneven margins, double spaces)
- Inconsistent bullet point styles (mixing •, -, *, etc.)
- Inconsistent date formats (Jan 2024 vs January 2024 vs 01/2024)
- Section headers not consistent in style/casing
- Missing section separators or poor visual hierarchy
- Wall of text with no whitespace
- Too many fonts or font sizes
- Inconsistent indentation
- Resume too dense or too sparse
- Contact info poorly formatted
- Bullet points too long (over 2 lines) or too short (under 5 words)

JOB DESCRIPTION:
${jobDescription.substring(0, 3000)}

RESUME:
${resumeText.substring(0, 6000)}`
    }]
  });

  const text = message.content[0].text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    let fixed = jsonMatch[0];
    fixed = fixed.replace(/,\s*([}\]])/g, '$1');
    if (!fixed.endsWith('}')) {
      const ob = (fixed.match(/\{/g) || []).length;
      const cb = (fixed.match(/\}/g) || []).length;
      const oq = (fixed.match(/\[/g) || []).length;
      const cq = (fixed.match(/\]/g) || []).length;
      fixed += ']'.repeat(Math.max(0, oq - cq));
      fixed += '}'.repeat(Math.max(0, ob - cb));
    }
    try { return JSON.parse(fixed); } catch { return null; }
  }
}

// Produce precise, VERBATIM in-place edits so they can be applied to the original DOCX
// without disturbing its formatting. Critical constraint: every "find" / "removeLines" value
// must be copied character-for-character from the resume, so the surgical applier can locate
// it. This is what makes grammar + bullet rewrites actually land — the recruiter-screen
// excerpts are truncated/paraphrased and almost never match the real text.
async function planResumeEdits(resumeText, jobDescription) {
  const client = getAnthropicClient();
  if (!client) return null;

  const message = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `You are a professional resume editor tailoring a resume to a specific job while PRESERVING its layout. Return ONLY edits that can be applied by exact text replacement.

Use this methodology:
<skill name="recruiter-skills">
${SKILL_RECRUITER.substring(0, 4000)}
</skill>
<skill name="resume-quantifier">
${SKILL_QUANTIFY.substring(0, 1500)}
</skill>

Return ONLY valid JSON (no markdown, no backticks):
{
  "replacements": [
    {"find": "EXACT verbatim text copied from the RESUME", "replace": "improved, JD-tailored version — roughly the same length"}
  ],
  "removeLines": ["EXACT verbatim line/bullet from the RESUME that is irrelevant to this job"],
  "skillsToAdd": ["Concrete tech/tool/framework from the JD the candidate plausibly has but isn't listed"],
  "skillsToRemove": ["Exact skill token in the resume that is irrelevant to this job"]
}

HARD RULES:
- Every "find" and every "removeLines" entry MUST be an EXACT substring of the RESUME below — copy it character-for-character (same punctuation, capitalization, spacing). If you cannot copy it exactly, DO NOT include it.
- "replace" must: fix grammar, turn weak/vague bullets into action-verb + quantified-impact statements, and mirror the JD's exact terminology where truthful. NEVER invent employers, dates, degrees, or metrics that aren't already implied.
- Each "find" is ONE bullet / line / short phrase — never span multiple paragraphs.
- "removeLines": only content clearly irrelevant to THIS job (unrelated domain, filler, outdated tech).
- "skillsToAdd": only genuinely relevant, concrete tech from the JD (languages/frameworks/tools), not soft-skill fluff.
- Aim for 6–15 high-value replacements. Quality over quantity — a sensible resume, not a keyword list.

JOB DESCRIPTION:
${(jobDescription || '').substring(0, 3000)}

RESUME:
${(resumeText || '').substring(0, 7000)}`
    }]
  });

  const parsed = parseJsonLoose(message.content[0].text);
  if (!parsed) return null;
  const arr = v => (Array.isArray(v) ? v : []);
  return {
    replacements: arr(parsed.replacements),
    removeLines: arr(parsed.removeLines),
    skillsToAdd: arr(parsed.skillsToAdd),
    skillsToRemove: arr(parsed.skillsToRemove),
  };
}

// --- Routes ---

router.post('/score', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription) return res.status(400).json({ error: 'Job description is required' });
    if (!req.file) return res.status(400).json({ error: 'Resume file is required' });

    const resumeText = await extractTextFromFile(req.file.path, req.file.originalname);

    let atsResult, keywordSource;
    try {
      const atsKeywords = await extractATSKeywords(jobDescription);
      if (atsKeywords) {
        atsResult = atsScore(resumeText, atsKeywords);
        keywordSource = 'ai';
      }
    } catch (err) {
      console.error('AI ATS extraction failed:', err.message);
    }

    if (!atsResult) {
      const keywords = extractKeywordsFallback(jobDescription);
      atsResult = fallbackScore(resumeText, keywords);
      keywordSource = 'fallback';
    }

    const recruiterResult = await recruiterScreen(resumeText, jobDescription).catch(err => {
      console.error('Recruiter screening failed:', err.message);
      return null;
    });

    fs.unlinkSync(req.file.path);

    // A strict/original ATS credits ONLY literal hits, so anything you merely demonstrate
    // (the exact JD phrase — e.g. "take ownership" — is absent) is genuinely missing to that
    // ATS. Surface those verbatim JD phrases in the Missing list too, not just the Demonstrated
    // section, so the exact term gets flagged and added. (Sets are disjoint — no duplicates.)
    const missingWithDemonstrated = [...atsResult.missing, ...atsResult.demonstratedMissing];

    res.json({
      score: atsResult.overallScore,               // strict / original ATS (literal only)
      demonstratedScore: atsResult.demonstratedScore, // literal + implied evidence
      matchedKeywords: atsResult.matched,          // literal hits only
      demonstratedMissing: atsResult.demonstratedMissing, // implied — keyword absent, add it
      missingKeywords: missingWithDemonstrated,    // fully-missing + demonstrated-but-literal-missing
      categoryScores: atsResult.categoryScores,
      requiredMissing: atsResult.requiredMissing,
      autoReject: atsResult.autoReject,
      totalKeywords: atsResult.matched.length + atsResult.demonstratedMissing.length + atsResult.missing.length,
      keywordSource,
      recruiterScreen: recruiterResult
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

router.post('/keywords', authenticateToken, async (req, res) => {
  const { jobDescription } = req.body;
  if (!jobDescription) return res.status(400).json({ error: 'Job description is required' });

  try {
    const atsKeywords = await extractATSKeywords(jobDescription);
    if (atsKeywords) return res.json({ keywords: atsKeywords, source: 'ai' });
  } catch (err) {
    console.error('AI extraction failed:', err.message);
  }
  const keywords = extractKeywordsFallback(jobDescription);
  res.json({ keywords, source: 'fallback' });
});

router.post('/scrape', authenticateToken, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  try { new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL' }); }

  try {
    const axios = require('axios');
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      maxRedirects: 5
    });
    const text = extractTextFromHtml(response.data);
    let keywords, source;
    try {
      const atsKeywords = await extractATSKeywords(text);
      if (atsKeywords) { keywords = atsKeywords; source = 'ai'; }
    } catch (err) {
      console.error('AI extraction failed:', err.message);
    }
    if (!keywords) {
      keywords = extractKeywordsFallback(text);
      source = 'fallback';
    }
    res.json({ jobDescription: text, keywords, keywordSource: source });
  } catch (err) {
    const message = err.response
      ? `Failed to fetch page (HTTP ${err.response.status})`
      : err.code === 'ECONNABORTED' ? 'Request timed out' : 'Failed to fetch the job posting';
    res.status(500).json({ error: message });
  }
});

function extractTextFromHtml(html) {
  let text = html;
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ');
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, ' ');
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ' ');
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, ' ');
  text = text.replace(/<!--[\s\S]*?-->/g, ' ');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/(?:p|div|h[1-6]|li|tr|section|article)>/gi, '\n');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&nbsp;/gi, ' ');
  text = text.replace(/&amp;/gi, '&');
  text = text.replace(/&lt;/gi, '<');
  text = text.replace(/&gt;/gi, '>');
  text = text.replace(/&quot;/gi, '"');
  text = text.replace(/&#39;/gi, "'");
  text = text.replace(/&[a-z]+;/gi, ' ');
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n/g, '\n\n');
  text = text.trim();
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  return lines.join('\n').substring(0, 10000);
}

// --- Quick formatting glitch detection (lightweight, Haiku) ---

async function quickFormattingCheck(resumeText) {
  const client = getAnthropicClient();
  if (!client) return [];

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are a professional resume formatter. Check this resume for formatting glitches only — not content quality.

Return ONLY a valid JSON array (no markdown, no explanation):
[{"issue": "Short description", "location": "Where in resume", "fix": "How to correct it"}]

Flag ONLY real glitches: inconsistent date formats (e.g. Jan 2024 vs 01/2024), mixed bullet styles (•, -, *), tense inconsistencies within same section, obvious typos, trailing spaces or double spaces, inconsistent capitalization of section headers, bullet points over 2 lines or under 5 words, missing contact separators.

Do NOT flag style preferences. If no glitches found, return [].

Resume:
${resumeText.substring(0, 4000)}`
      }]
    });

    const text = message.content[0].text.trim();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]);
  } catch {
    return [];
  }
}

// --- DOCX XML helpers (pizzip-based, copies original file exactly) ---

function xmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getDocxParagraphs(xml) {
  const result = [];
  const pRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  let m;
  while ((m = pRegex.exec(xml)) !== null) {
    const pXml = m[0];
    const texts = [];
    const tRegex = /<w:t(?:[^>]*)>([\s\S]*?)<\/w:t>/g;
    let tm;
    while ((tm = tRegex.exec(pXml)) !== null) texts.push(tm[1]);
    result.push({ xml: pXml, text: texts.join('') });
  }
  return result;
}

function findSkillsParagraphIdx(paragraphs) {
  // Strategy 1: paragraph after a "Skills" section header
  for (let i = 0; i < paragraphs.length - 1; i++) {
    const t = paragraphs[i].text.trim();
    if (/^(technical\s+skills?|skills?|core\s+competencies|technologies|tools(\s+&\s+technologies)?|technical\s+expertise|proficiencies)$/i.test(t)) {
      // Return the next non-empty paragraph
      for (let j = i + 1; j < Math.min(i + 4, paragraphs.length); j++) {
        if (paragraphs[j].text.trim().length > 5) return j;
      }
      return i + 1;
    }
  }
  // Strategy 2: highest tech keyword density
  const techRx = /\b(python|javascript|typescript|java|react|angular|vue|node\.?js|express|django|flask|spring|aws|azure|gcp|docker|kubernetes|sql|mongodb|postgresql|mysql|redis|kafka|git|terraform|ansible|jenkins|ci\/cd|html|css|webpack|pandas|numpy|tensorflow|pytorch|machine\s+learning|rest\s+api|graphql|linux|bash|c\+\+|c#|\.net|ruby|rails|php|go|rust|swift|kotlin|scala|jira|agile|scrum|figma|tableau|power\s*bi|excel|salesforce|sap)\b/gi;
  let best = -1, bestScore = 0;
  for (let i = 0; i < paragraphs.length; i++) {
    const t = paragraphs[i].text;
    const score = (t.match(techRx) || []).length * 2 + (t.match(/,/g) || []).length;
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return bestScore >= 3 ? best : -1;
}

// The body-level <w:sectPr> (final section properties) MUST be the last child of <w:body>.
// Appending content right before </w:body> puts it *after* sectPr, which makes Word treat
// the file as corrupt. Insert before that trailing sectPr when present.
function insertBeforeBodyEnd(xml, content) {
  const bodyClose = xml.lastIndexOf('</w:body>');
  if (bodyClose === -1) return xml + content;
  const lastP = xml.lastIndexOf('</w:p>', bodyClose);
  const sectPr = xml.indexOf('<w:sectPr', lastP === -1 ? 0 : lastP);
  const at = (sectPr !== -1 && sectPr < bodyClose) ? sectPr : bodyClose;
  return xml.slice(0, at) + content + xml.slice(at);
}

function addRunToParagraph(pXml, text) {
  // Find the last </w:r> and insert a new run after it (before </w:p>)
  const lastRun = pXml.lastIndexOf('</w:r>');
  const newRun = `<w:r><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r>`;
  if (lastRun === -1) {
    return pXml.replace('</w:p>', `${newRun}</w:p>`);
  }
  const pos = lastRun + '</w:r>'.length;
  return pXml.slice(0, pos) + newRun + pXml.slice(pos);
}

// Normalize a line for tolerant matching: drop leading bullets, trailing ellipsis/dots,
// collapse whitespace, lowercase. Recruiter audit lines are truncated (~60 chars, often
// ending in "…"), so exact substring matching against the resume fails without this.
function normalizeForMatch(s) {
  return String(s || '')
    .replace(/^[\s•\-*◦▪–—]+/, '')
    .replace(/[\s.…]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// True when a resume paragraph corresponds to a (possibly truncated/paraphrased) audit line.
function lineMatchesParagraph(paraText, lineText) {
  const npara = normalizeForMatch(paraText);
  const nline = normalizeForMatch(lineText);
  if (!npara || nline.length < 8) return false;
  if (npara.includes(nline) || nline.includes(npara)) return true;
  // Anchor on the leading chunk — the audit line is usually a prefix excerpt of the paragraph.
  const anchor = nline.slice(0, 50);
  if (anchor.length >= 12 && npara.includes(anchor)) return true;
  const words = nline.split(' ').filter(Boolean);
  if (words.length >= 4) {
    const phrase = words.slice(0, 6).join(' ');
    if (phrase.length >= 15 && npara.includes(phrase)) return true;
  }
  return false;
}

// Replace `original`→`corrected` inside ONE paragraph even when the text is split across
// multiple <w:r><w:t> runs (Word splits sentences arbitrarily, which defeats a raw XML
// search). Joins the paragraph's run text, replaces there, writes the result into the first
// <w:t> and blanks the remaining ones (keeps the first run's formatting for the whole line).
function replaceTextAcrossRuns(pXml, original, corrected) {
  const decode = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  const tRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
  let m, fullPlain = '';
  while ((m = tRegex.exec(pXml)) !== null) fullPlain += decode(m[1]);
  if (!fullPlain) return { xml: pXml, changed: false };

  let usedOriginal = original;
  if (!fullPlain.includes(original)) {
    const li = fullPlain.toLowerCase().indexOf(original.toLowerCase());
    if (li === -1) return { xml: pXml, changed: false };
    usedOriginal = fullPlain.substr(li, original.length); // preserve resume's actual casing
  }
  const newFull = fullPlain.split(usedOriginal).join(corrected);

  let count = 0;
  const out = pXml.replace(/<w:t\b([^>]*)>([\s\S]*?)<\/w:t>/g, (whole, attrs) => {
    count++;
    if (count === 1) {
      const a = /xml:space=/.test(attrs) ? attrs : `${attrs} xml:space="preserve"`;
      return `<w:t${a}>${xmlEscape(newFull)}</w:t>`;
    }
    return `<w:t${attrs}></w:t>`;
  });
  return { xml: out, changed: true };
}

// Given the joined text of a comma-separated list, drop tokens that match a skill to remove.
// Returns the rebuilt list text and which tokens were removed. Handles "Label: skill" items.
function filterSkillList(listText, skillSet) {
  const parts = listText.split(',');
  const kept = [], removed = [];
  for (const part of parts) {
    const candidate = part.split(':').pop().trim(); // handle "Languages: Python"
    if (candidate && candidate.length <= 30 && skillSet.has(candidate.toLowerCase())) {
      removed.push(candidate);
    } else {
      kept.push(part);
    }
  }
  let out = kept.join(',')
    .replace(/,\s*,/g, ', ')
    .replace(/^\s*,\s*/, '')
    .replace(/\s*,\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return { text: out, removed };
}

// Remove irrelevant skills from ONE paragraph's comma list (run-aware, like the grammar fix).
function removeSkillsFromParagraph(pXml, skillSet) {
  const decode = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  const tRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
  let m, fullPlain = '';
  while ((m = tRegex.exec(pXml)) !== null) fullPlain += decode(m[1]);
  if (!fullPlain || !fullPlain.includes(',')) return { xml: pXml, changed: false, removed: [] };

  const { text: newFull, removed } = filterSkillList(fullPlain, skillSet);
  if (removed.length === 0) return { xml: pXml, changed: false, removed: [] };

  let count = 0;
  const out = pXml.replace(/<w:t\b([^>]*)>([\s\S]*?)<\/w:t>/g, (whole, attrs) => {
    count++;
    if (count === 1) {
      const a = /xml:space=/.test(attrs) ? attrs : `${attrs} xml:space="preserve"`;
      return `<w:t${a}>${xmlEscape(newFull)}</w:t>`;
    }
    return `<w:t${attrs}></w:t>`;
  });
  return { xml: out, changed: true, removed };
}

async function modifyDocxInPlace(fileBuffer, missingRequired, missingPreferred, linesToRemove = [], grammarFixes = [], skillsToRemove = []) {
  const PizZip = require('pizzip');
  const zip = new PizZip(fileBuffer);
  let xml = zip.file('word/document.xml').asText();

  const changeLog = [];

  // 1. Remove lines flagged by recruiter screen (tolerant of truncated audit excerpts)
  if (linesToRemove && linesToRemove.length > 0) {
    for (const lineText of linesToRemove) {
      if (!lineText || !normalizeForMatch(lineText)) continue;
      const paragraphs = getDocxParagraphs(xml); // recompute — xml mutates as we remove
      const match = paragraphs.find(p => lineMatchesParagraph(p.text, lineText));
      if (match) {
        const idx = xml.indexOf(match.xml);
        if (idx !== -1) {
          xml = xml.slice(0, idx) + xml.slice(idx + match.xml.length);
          const shown = match.text.trim() || lineText.trim();
          changeLog.push(`Removed: "${shown.substring(0, 80)}${shown.length > 80 ? '…' : ''}"`);
        }
      }
    }
  }

  // 2. Apply grammar fixes — raw XML replace first, then run-aware per-paragraph fallback
  if (grammarFixes && grammarFixes.length > 0) {
    for (const fix of grammarFixes) {
      const original = (fix.text || fix.original || '').trim();
      const corrected = (fix.fix || fix.corrected || '').trim();
      if (!original || !corrected || original === corrected) continue;

      const escapedOrig = xmlEscape(original);
      if (xml.includes(escapedOrig)) {
        // Single-run case: the phrase sits in one <w:t>.
        xml = xml.split(escapedOrig).join(xmlEscape(corrected));
        changeLog.push(`Grammar fix: "${original}" → "${corrected}"`);
        continue;
      }

      // Run-split case: locate the paragraph and replace across its runs.
      const paragraphs = getDocxParagraphs(xml);
      const nOrig = normalizeForMatch(original);
      const para = paragraphs.find(p =>
        p.text.includes(original) ||
        p.text.toLowerCase().includes(original.toLowerCase()) ||
        normalizeForMatch(p.text).includes(nOrig)
      );
      if (para) {
        const { xml: newPara, changed } = replaceTextAcrossRuns(para.xml, original, corrected);
        if (changed) {
          const idx = xml.indexOf(para.xml);
          xml = xml.slice(0, idx) + newPara + xml.slice(idx + para.xml.length);
          changeLog.push(`Grammar fix: "${original}" → "${corrected}"`);
        }
      }
    }
  }

  // 2b. Remove irrelevant skills — strip matching tokens from comma-separated skills lines
  if (skillsToRemove && skillsToRemove.length > 0) {
    const skillSet = new Set(skillsToRemove.map(s => String(s.skill || s).trim().toLowerCase()).filter(Boolean));
    if (skillSet.size > 0) {
      const paragraphs = getDocxParagraphs(xml);
      for (const para of paragraphs) {
        if (!para.text.includes(',')) continue;
        const { xml: newPara, changed, removed } = removeSkillsFromParagraph(para.xml, skillSet);
        if (changed) {
          const idx = xml.indexOf(para.xml);
          if (idx !== -1) {
            xml = xml.slice(0, idx) + newPara + xml.slice(idx + para.xml.length);
            changeLog.push(`Removed irrelevant skills: ${removed.join(', ')}`);
          }
        }
      }
    }
  }

  // 3. Add missing skills
  const paragraphs2 = getDocxParagraphs(xml);
  const skillsIdx = findSkillsParagraphIdx(paragraphs2);

  const toAdd = [
    ...missingRequired.map(k => k.keyword || k),
    ...missingPreferred.slice(0, 6).map(k => k.keyword || k)
  ];

  if (toAdd.length === 0) {
    if (changeLog.length === 0) changeLog.push('No changes needed — resume already covers this JD.');
  } else if (skillsIdx >= 0) {
    const para = paragraphs2[skillsIdx];
    const addText = `, ${toAdd.join(', ')}`;
    const newPara = addRunToParagraph(para.xml, addText);
    const idx = xml.indexOf(para.xml);
    xml = xml.slice(0, idx) + newPara + xml.slice(idx + para.xml.length);
    changeLog.push(`Skills added: ${toAdd.join(', ')}`);
  } else {
    const newSection = `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Technical Skills</w:t></w:r></w:p><w:p><w:r><w:t xml:space="preserve">${xmlEscape(toAdd.join(', '))}</w:t></w:r></w:p>`;
    xml = insertBeforeBodyEnd(xml, newSection);
    changeLog.push(`Added new Technical Skills section: ${toAdd.join(', ')}`);
  }

  zip.file('word/document.xml', xml);
  const buffer = zip.generate({
    type: 'nodebuffer',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE'
  });
  return { buffer, changeLog };
}

// --- PDF fallback: rebuild a structure-aware DOCX mirroring the original layout ---

async function buildStructureDocxFromText(resumeText, missingRequired, missingPreferred, linesToRemove = [], grammarFixes = [], skillsToRemove = []) {
  const { Document, Paragraph, TextRun, Packer } = require('docx');

  const skillRemoveSet = new Set((skillsToRemove || []).map(s => String(s.skill || s).trim().toLowerCase()).filter(Boolean));

  // Apply grammar fixes to the raw text first (case-insensitive fallback)
  let processedText = resumeText;
  const grammarChangeLog = [];
  for (const fix of (grammarFixes || [])) {
    const original = (fix.text || fix.original || '').trim();
    const corrected = (fix.fix || fix.corrected || '').trim();
    if (!original || !corrected || original === corrected) continue;
    if (processedText.includes(original)) {
      processedText = processedText.split(original).join(corrected);
      grammarChangeLog.push(`Grammar fix: "${original}" → "${corrected}"`);
    } else {
      const i = processedText.toLowerCase().indexOf(original.toLowerCase());
      if (i !== -1) {
        const actual = processedText.substr(i, original.length);
        processedText = processedText.split(actual).join(corrected);
        grammarChangeLog.push(`Grammar fix: "${actual}" → "${corrected}"`);
      }
    }
  }

  const linesToRemoveList = (linesToRemove || []).filter(l => normalizeForMatch(l));
  const removeChangeLog = [];

  const lines = processedText.split('\n').map(l => l.trimEnd());
  const toAdd = [
    ...missingRequired.map(k => k.keyword || k),
    ...missingPreferred.slice(0, 6).map(k => k.keyword || k)
  ];
  const changeLog = [];
  let skillsKeywordsAdded = false;
  let inSkillsSection = false;

  const children = [];

  for (const raw of lines) {
    const line = raw.trimEnd();
    let trimmed = line.trim();

    if (!trimmed) {
      children.push(new Paragraph({ children: [new TextRun('')], spacing: { after: 60 } }));
      continue;
    }

    // Skip lines flagged for removal (tolerant of truncated audit excerpts)
    if (linesToRemoveList.length > 0) {
      const matched = linesToRemoveList.find(r => lineMatchesParagraph(trimmed, r));
      if (matched) {
        removeChangeLog.push(`Removed: "${trimmed.substring(0, 80)}${trimmed.length > 80 ? '…' : ''}"`);
        continue;
      }
    }

    // Strip irrelevant skills from comma-separated lines
    if (skillRemoveSet.size > 0 && trimmed.includes(',')) {
      const { text: stripped, removed } = filterSkillList(trimmed, skillRemoveSet);
      if (removed.length > 0) {
        removeChangeLog.push(`Removed irrelevant skills: ${removed.join(', ')}`);
        if (!stripped) continue; // whole line was irrelevant skills
        trimmed = stripped;
      }
    }

    // Section header: all-caps short line, or known section names
    const isHeader = (trimmed === trimmed.toUpperCase() && trimmed.length > 2 && /[A-Z]/.test(trimmed) && trimmed.length < 55 && !/^\d/.test(trimmed)) ||
      /^(SKILLS|TECHNICAL SKILLS|EXPERIENCE|WORK EXPERIENCE|EDUCATION|PROJECTS|CERTIFICATIONS|SUMMARY|OBJECTIVE|CONTACT|PUBLICATIONS|AWARDS|VOLUNTEER)/i.test(trimmed);

    const isSkillsHeader = isHeader && /skills?|competencies|technologies|expertise|proficiencies/i.test(trimmed);
    const isBullet = /^[•\-\*◦▪]\s/.test(trimmed);

    if (isHeader) {
      inSkillsSection = isSkillsHeader;
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed, bold: true, size: 24 })],
        spacing: { before: 240, after: 80 },
        border: { bottom: { color: '2563eb', size: 6, space: 1, style: 'single' } }
      }));
    } else if (isBullet) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed.replace(/^[•\-\*◦▪]\s*/, ''), size: 20 })],
        bullet: { level: 0 },
        spacing: { after: 40 }
      }));
    } else {
      // If this is a skills line and we haven't added keywords yet, add them here
      let displayText = trimmed;
      if (inSkillsSection && !skillsKeywordsAdded && toAdd.length > 0) {
        displayText += `, ${toAdd.join(', ')}`;
        skillsKeywordsAdded = true;
        changeLog.push(`Skills added: ${toAdd.join(', ')}`);
      }
      children.push(new Paragraph({
        children: [new TextRun({ text: displayText, size: 20 })],
        spacing: { after: 40 }
      }));
    }
  }

  // If skills section wasn't found, append one
  if (!skillsKeywordsAdded && toAdd.length > 0) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: 'TECHNICAL SKILLS', bold: true, size: 24 })], spacing: { before: 240, after: 80 } }),
      new Paragraph({ children: [new TextRun({ text: toAdd.join(', '), size: 20 })], spacing: { after: 40 } })
    );
    changeLog.push(`Added new Technical Skills section: ${toAdd.join(', ')}`);
  }

  changeLog.push(...removeChangeLog, ...grammarChangeLog);

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri', size: 20, color: '1a1a2e' } } } },
    sections: [{ properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } }, children }]
  });

  const buffer = await Packer.toBuffer(doc);
  return { buffer, changeLog };
}

// --- Review endpoint: lightweight analysis for Review tab ---

router.post('/review', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription) return res.status(400).json({ error: 'Job description is required' });
    if (!req.file) return res.status(400).json({ error: 'Resume file is required' });

    const resumeText = await extractTextFromFile(req.file.path, req.file.originalname);
    fs.unlinkSync(req.file.path);

    let atsResult, keywordSource;
    try {
      const atsKeywords = await extractATSKeywords(jobDescription);
      if (atsKeywords) {
        atsResult = atsScore(resumeText, atsKeywords);
        keywordSource = 'ai';
      }
    } catch (err) {
      console.error('ATS extraction failed:', err.message);
    }

    if (!atsResult) {
      const kws = extractKeywordsFallback(jobDescription);
      atsResult = fallbackScore(resumeText, kws);
      keywordSource = 'fallback';
    }

    const glitches = await quickFormattingCheck(resumeText);

    res.json({
      atsScore: atsResult.overallScore,
      matched: atsResult.matched,
      missingRequired: atsResult.requiredMissing || [],
      missingPreferred: atsResult.missing.filter(k => k.priority === 'preferred'),
      glitches,
      keywordSource
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

// --- Generate endpoint: returns binary DOCX (copy of original + minimal additions) ---

router.post('/generate', authenticateToken, upload.single('resume'), async (req, res) => {
  let filePath = req.file?.path;
  try {
    const { jobDescription, company, position } = req.body;
    if (!jobDescription) return res.status(400).json({ error: 'Job description is required' });
    if (!req.file) return res.status(400).json({ error: 'Resume file is required' });

    const ext = path.extname(req.file.originalname).toLowerCase();

    // Read the raw file bytes BEFORE extracting text (both need the file)
    const fileBuffer = fs.readFileSync(req.file.path);
    const resumeText = await extractTextFromFile(req.file.path, req.file.originalname);
    fs.unlinkSync(req.file.path);
    filePath = null;

    // Use pre-computed missing keywords if provided (from ATS Scanner), else re-analyse
    let missingRequired = [], missingPreferred = [], linesToRemove = [], skillsToRemove = [], grammarFixes = [];
    if (req.body.missingRequiredJson) {
      try {
        missingRequired = JSON.parse(req.body.missingRequiredJson);
        missingPreferred = JSON.parse(req.body.missingPreferredJson || '[]');
        linesToRemove = JSON.parse(req.body.linesToRemoveJson || '[]');
        skillsToRemove = JSON.parse(req.body.skillsToRemoveJson || '[]');
        grammarFixes = JSON.parse(req.body.grammarFixesJson || '[]');
      } catch { /* fall through to re-analysis */ }
    }
    if (missingRequired.length === 0 && jobDescription) {
      try {
        const atsKeywords = await extractATSKeywords(jobDescription);
        if (atsKeywords) {
          const result = atsScore(resumeText, atsKeywords);
          missingRequired = result.requiredMissing || [];
          missingPreferred = result.missing.filter(k => k.priority === 'preferred');
        }
      } catch (err) {
        console.error('ATS extraction failed:', err.message);
      }
    }

    // AI edit plan: verbatim find/replace so grammar fixes AND bullet rewrites actually apply
    // in-place, plus a sensible tech-stack update — not just a keyword dump. Verbatim `find`
    // values make the surgical applier reliable. Best-effort: falls back to keyword-only edits.
    if (jobDescription) {
      try {
        const plan = await planResumeEdits(resumeText, jobDescription);
        if (plan) {
          grammarFixes = [
            ...grammarFixes,
            ...plan.replacements
              .filter(r => r && r.find && r.replace && r.find !== r.replace)
              .map(r => ({ original: r.find, corrected: r.replace })),
          ];
          linesToRemove = [...linesToRemove, ...plan.removeLines.filter(Boolean)];
          skillsToRemove = [...skillsToRemove, ...plan.skillsToRemove.filter(Boolean).map(s => ({ skill: s }))];
          const haveReq = new Set(missingRequired.map(k => String(k.keyword || k).toLowerCase()));
          for (const s of plan.skillsToAdd) {
            const key = String(s || '').toLowerCase();
            if (key && !haveReq.has(key)) { missingRequired.push(s); haveReq.add(key); }
          }
        }
      } catch (err) {
        console.error('Resume edit planning failed:', err.message);
      }
    }

    let docxBuffer, changeLog;

    if (ext === '.docx') {
      // Copy original DOCX exactly, surgically modify XML
      ({ buffer: docxBuffer, changeLog } = await modifyDocxInPlace(fileBuffer, missingRequired, missingPreferred, linesToRemove, grammarFixes, skillsToRemove));
    } else {
      // PDF: can't modify in-place — rebuild a structure-aware DOCX
      ({ buffer: docxBuffer, changeLog } = await buildStructureDocxFromText(resumeText, missingRequired, missingPreferred, linesToRemove, grammarFixes, skillsToRemove));
      changeLog = ['Note: PDF cannot be edited in-place — rebuilt with matching section structure.', ...changeLog];
    }

    const filename = [company, position, 'resume'].filter(Boolean).join('_').replace(/[^a-z0-9_\-]/gi, '_') || 'tailored_resume';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.docx"`);
    // URI-encode: change-log entries contain non-Latin1 chars (→, —, curly quotes)
    // that are illegal in HTTP header values and throw "Invalid character in header content".
    res.setHeader('X-Change-Log', encodeURIComponent(JSON.stringify(changeLog)));
    res.setHeader('Access-Control-Expose-Headers', 'X-Change-Log, Content-Disposition');
    res.send(docxBuffer);
  } catch (err) {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: err.message });
  }
});

// --- Outreach: marketing-style emails to HM and Recruiter + LinkedIn ---

router.post('/outreach', authenticateToken, async (req, res) => {
  const { jobDescription, company, position } = req.body;
  if (!jobDescription) return res.status(400).json({ error: 'Job description is required' });

  const client = getAnthropicClient();
  if (!client) return res.status(500).json({ error: 'AI not configured' });

  const context = [
    company ? `Company: ${company}` : '',
    position ? `Position: ${position}` : '',
    `Job Description:\n${jobDescription.substring(0, 3000)}`
  ].filter(Boolean).join('\n');

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1600,
    messages: [{
      role: 'user',
      content: `You are an expert job search strategist who writes marketing copy for job seekers. Generate highly personalized, non-generic outreach for a job application.

CONTEXT:
${context}

WHAT TO WRITE:

1. EMAIL TO HIRING MANAGER (value-focused, AIDA framework):
   - Subject: Specific, hooks curiosity, under 60 chars — use numbers or specificity (e.g. "5 yrs Python + ML: ready to join [Team] at [Company]")
   - Body: 4 short paragraphs under 180 words total
     Para 1: Open with something specific about their team's work or a pain point in the JD — NOT "I am writing to"
     Para 2: ONE quantified result you've achieved that directly maps to their tech stack or challenge
     Para 3: Specific reason why this team/product/mission excites you (use details from the JD)
     Para 4: Low-pressure CTA — offer to share more, not beg for interview

2. EMAIL TO RECRUITER (qualification-aligned, concise):
   - Subject: Lead with qualifications, mirror JD language, under 60 chars
   - Body: 3 short paragraphs under 130 words total
     Para 1: "I match X of your Y key requirements for [role]" — be direct
     Para 2: 2-3 bullet-style qualifications using the EXACT words from the JD requirements
     Para 3: Availability statement + clear CTA

3. LINKEDIN MESSAGE (connection request):
   - 150-250 chars, first-person
   - Open with a specific hook from the JD or company news
   - One specific value statement
   - End with a soft question, not "please connect with me"

RULES FOR ALL:
- NEVER use: "I hope this finds you well", "I am passionate about", "I am writing to express my interest", "Please consider me"
- Use SPECIFIC details from the JD (tech stack, team names, product areas, metrics mentioned)
- Recruiter email mirrors their exact keyword language (for ATS and pattern matching)
- HM email speaks to business impact, not just qualifications

Return ONLY valid JSON (no markdown):
{
  "hm_email_subject": "Subject under 60 chars",
  "hm_email_body": "HM email body under 180 words",
  "recruiter_email_subject": "Subject under 60 chars",
  "recruiter_email_body": "Recruiter email body under 130 words",
  "linkedin_message": "150-250 char connection message"
}`
    }]
  });

  const text = message.content[0].text.trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return res.status(500).json({ error: 'Failed to generate outreach' });

  try {
    res.json(JSON.parse(match[0]));
  } catch {
    res.status(500).json({ error: 'Failed to parse AI response' });
  }
});

// --- Download resume as DOCX ---

router.post('/download-resume', authenticateToken, async (req, res) => {
  const { text, filename } = req.body;
  if (!text) return res.status(400).json({ error: 'Resume text is required' });

  try {
    const { Document, Paragraph, TextRun, Packer, HeadingLevel, AlignmentType } = require('docx');

    const lines = text.split('\n');
    const paragraphs = [];

    for (const raw of lines) {
      const line = raw.trimEnd();

      // Blank line → spacer paragraph
      if (!line.trim()) {
        paragraphs.push(new Paragraph({ children: [new TextRun('')], spacing: { after: 60 } }));
        continue;
      }

      const trimmed = line.trim();

      // Section header heuristic: ALL CAPS line, or line ending with colon, or short all-caps
      const isHeader = (
        (trimmed === trimmed.toUpperCase() && trimmed.length > 2 && /[A-Z]/.test(trimmed) && !/^\d/.test(trimmed)) ||
        (trimmed.endsWith(':') && trimmed.length < 40 && trimmed === trimmed.toUpperCase().replace(':', ':'))
      );

      // Bullet heuristic: starts with •, -, *, or ◦
      const isBullet = /^[•\-\*◦]\s/.test(trimmed);

      if (isHeader) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: trimmed, bold: true, size: 24 })],
          spacing: { before: 200, after: 80 },
          border: { bottom: { color: '2563eb', size: 6, space: 1, style: 'single' } }
        }));
      } else if (isBullet) {
        const bulletText = trimmed.replace(/^[•\-\*◦]\s*/, '');
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: bulletText, size: 20 })],
          bullet: { level: 0 },
          spacing: { after: 40 }
        }));
      } else {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: trimmed, size: 20 })],
          spacing: { after: 40 }
        }));
      }
    }

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: 'Calibri', size: 20, color: '1a1a2e' }
          }
        }
      },
      sections: [{
        properties: {
          page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } }
        },
        children: paragraphs
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    const safeName = (filename || 'tailored_resume').replace(/[^a-z0-9_\-]/gi, '_');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.docx"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// Test-only hook: expose internals for unit tests without widening the public surface.
if (process.env.NODE_ENV === 'test') {
  module.exports.__test = { modifyDocxInPlace, getDocxParagraphs, replaceTextAcrossRuns, insertBeforeBodyEnd };
}
