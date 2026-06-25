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

// --- Traditional ATS: AI-powered keyword extraction with categorization ---

async function extractATSKeywords(jobDescription) {
  const client = getAnthropicClient();
  if (!client) return null;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
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
    {"keyword": "exact term from JD", "priority": "required|preferred", "variations": ["abbreviation", "synonym", "alternate spelling"]}
  ],
  "softSkills": [
    {"keyword": "exact term", "priority": "required|preferred", "variations": []}
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

Job Description:
${jobDescription.substring(0, 6000)}`
    }]
  });

  const text = message.content[0].text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

// --- Traditional ATS: Keyword matching with variations ---

function atsMatch(resumeText, keyword, variations) {
  const lower = resumeText.toLowerCase();
  const allTerms = [keyword, ...(variations || [])];

  for (const term of allTerms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(resumeText)) {
      return { matched: true, matchedAs: term };
    }
  }

  if (lower.includes(keyword.toLowerCase())) {
    return { matched: true, matchedAs: keyword };
  }

  return { matched: false, matchedAs: null };
}

function countOccurrences(resumeText, keyword, variations) {
  const allTerms = [keyword, ...(variations || [])];
  let count = 0;
  for (const term of allTerms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    const matches = resumeText.match(regex);
    if (matches) count += matches.length;
  }
  return count;
}

// --- Traditional ATS: Weighted scoring ---

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
    matched: [],
    missing: [],
    categoryScores: {},
    totalWeightedScore: 0,
    maxWeightedScore: 0
  };

  for (const category of categories) {
    const items = atsKeywords[category] || [];
    if (items.length === 0) continue;

    const catResult = { matched: [], missing: [], score: 0, maxScore: 0 };

    for (const item of items) {
      const weight = categoryWeights[category] * priorityMultiplier[item.priority || 'preferred'];
      catResult.maxScore += weight;
      results.maxWeightedScore += weight;

      const match = atsMatch(resumeText, item.keyword, item.variations);
      const count = match.matched ? countOccurrences(resumeText, item.keyword, item.variations) : 0;

      const entry = {
        keyword: item.keyword,
        category,
        priority: item.priority,
        matchedAs: match.matchedAs,
        occurrences: count,
        weight
      };

      if (match.matched) {
        catResult.matched.push(entry);
        catResult.score += weight;
        results.totalWeightedScore += weight;
        results.matched.push(entry);
      } else {
        catResult.missing.push(entry);
        results.missing.push(entry);
      }
    }

    catResult.percentage = catResult.maxScore > 0 ? Math.round((catResult.score / catResult.maxScore) * 100) : 0;
    results.categoryScores[category] = catResult;
  }

  results.overallScore = results.maxWeightedScore > 0
    ? Math.round((results.totalWeightedScore / results.maxWeightedScore) * 100)
    : 0;

  const requiredMissing = results.missing.filter(m => m.priority === 'required');
  results.requiredMissing = requiredMissing;
  results.autoReject = requiredMissing.length > Math.ceil(results.missing.filter(m => m.priority === 'required').length * 0.5 + results.matched.filter(m => m.priority === 'required').length * 0.5 * 0.5);

  return results;
}

// --- Fallback for when AI is unavailable ---

function extractKeywordsFallback(jobDescription) {
  const text = jobDescription.toLowerCase();
  const techPattern = /\b(?:python|java|javascript|typescript|react|angular|vue|node\.?js|express|django|flask|spring|aws|azure|gcp|docker|kubernetes|sql|nosql|mongodb|postgresql|mysql|redis|kafka|rabbitmq|git|ci\/cd|jenkins|terraform|ansible|graphql|rest\s*api|api|microservices|agile|scrum|machine learning|deep learning|nlp|tensorflow|pytorch|pandas|numpy|scikit-learn|tableau|power bi|excel|hadoop|spark|airflow|etl|snowflake|databricks|html|css|webpack|next\.js|flutter|react native|swift|kotlin|go|rust|c\+\+|c#|\.net|ruby|rails|php|linux|bash|jira|github|gitlab|distributed systems|data structures|algorithms|cloud computing|devops)\b/gi;
  const matches = text.match(techPattern) || [];
  const seen = new Set();
  const keywords = [];
  for (const m of matches) {
    const lower = m.trim().toLowerCase();
    if (!seen.has(lower)) { seen.add(lower); keywords.push(m.trim()); }
  }
  return keywords.slice(0, 40);
}

function fallbackScore(resumeText, keywords) {
  const found = [], missing = [];
  for (const kw of keywords) {
    if (resumeText.toLowerCase().includes(kw.toLowerCase())) found.push(kw);
    else missing.push(kw);
  }
  return {
    overallScore: keywords.length > 0 ? Math.round((found.length / keywords.length) * 100) : 0,
    matched: found.map(k => ({ keyword: k, category: 'hardSkills', priority: 'required', matchedAs: k, occurrences: 1, weight: 1 })),
    missing: missing.map(k => ({ keyword: k, category: 'hardSkills', priority: 'required', matchedAs: null, occurrences: 0, weight: 1 })),
    categoryScores: {},
    requiredMissing: missing.map(k => ({ keyword: k, category: 'hardSkills', priority: 'required' })),
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

Use these skill guides as your expert knowledge:
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

    res.json({
      score: atsResult.overallScore,
      matchedKeywords: atsResult.matched,
      missingKeywords: atsResult.missing,
      categoryScores: atsResult.categoryScores,
      requiredMissing: atsResult.requiredMissing,
      autoReject: atsResult.autoReject,
      totalKeywords: atsResult.matched.length + atsResult.missing.length,
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

module.exports = router;
