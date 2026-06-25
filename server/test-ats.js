require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

// ── Synthetic Dataset ─────────────────────────────────────────────────────────

const JOB_DESCRIPTION = `
Senior React Frontend Engineer

Required Qualifications:
- 5+ years of JavaScript experience
- 3+ years of React experience
- TypeScript proficiency (must have)
- REST API integration
- Git version control
- Bachelor's degree in Computer Science or related field

Preferred Qualifications:
- Node.js experience
- AWS cloud services
- Docker or Kubernetes
- GraphQL
- Agile/Scrum methodology
- CI/CD pipelines experience
`;

const RESUMES = [
  {
    name: 'Perfect Match — Senior React Dev',
    expected: '>75',
    pass: s => s >= 75,
    text: `
John Smith | john@email.com
Senior Frontend Engineer — 5+ years JavaScript, 4 years React

EXPERIENCE
Senior Frontend Developer, TechCorp (2019–2024)
- Built React and TypeScript applications for 2M+ users
- Integrated REST APIs and GraphQL endpoints
- CI/CD pipelines with GitHub Actions, Docker, AWS
- Deployed to AWS EC2, S3, CloudFront
- Agile/Scrum sprints, Git version control, Node.js backend tools

EDUCATION
Bachelor's degree in Computer Science, State University, 2017

SKILLS
JavaScript, TypeScript, React, Node.js, REST APIs, GraphQL, Git,
AWS, Docker, Kubernetes, CI/CD, Agile, Scrum
`
  },
  {
    name: 'Partial Match — Backend Python Dev',
    expected: '10–65',
    pass: s => s >= 10 && s <= 65,
    text: `
Jane Doe | jane@email.com
Backend Software Engineer

EXPERIENCE
Backend Engineer, DataCorp (2020–2024)
- Python Django REST APIs
- PostgreSQL, Redis database design
- Docker containerization
- Git version control, Agile methodology

EDUCATION
Master's degree in Software Engineering, 2018

SKILLS
Python, Django, PostgreSQL, MySQL, Docker, Git, REST APIs, Agile
`
  },
  {
    name: 'No Match — Marketing Manager',
    expected: '<20',
    pass: s => s < 20,
    text: `
Alice Johnson | alice@email.com
Digital Marketing Manager

EXPERIENCE
Senior Marketing Manager, BrandCo (2018–2024)
- Digital marketing campaigns generating $5M revenue
- Social media management, 500K followers
- Google Analytics, SEO/SEM
- Email marketing with Mailchimp
- Adobe Photoshop, Illustrator, Canva

EDUCATION
Bachelor's degree in Marketing, Business University, 2015

SKILLS
Digital Marketing, SEO, SEM, Google Analytics, Social Media, Content Creation
`
  },
  {
    name: 'Edge Case — Nearly Empty Resume',
    expected: '~0',
    pass: s => s < 10,
    text: 'Bob Brown. Seeking opportunities. Hardworking individual.'
  }
];

// ── ATS Functions (mirrored from ats.js) ─────────────────────────────────────

function atsMatch(resumeText, keyword, variations) {
  const allTerms = [keyword, ...(variations || [])];
  for (const term of allTerms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(resumeText)) {
      return { matched: true, matchedAs: term };
    }
  }
  if (resumeText.toLowerCase().includes(keyword.toLowerCase())) {
    return { matched: true, matchedAs: keyword };
  }
  return { matched: false, matchedAs: null };
}

function atsScore(resumeText, atsKeywords) {
  const weights = { hardSkills: 3, tools: 3, experience: 2.5, education: 2, certifications: 2, softSkills: 1 };
  const priority = { required: 2, preferred: 1 };
  let score = 0, max = 0;
  for (const [cat, items] of Object.entries(atsKeywords)) {
    for (const item of (items || [])) {
      const w = (weights[cat] || 1) * (priority[item.priority] || 1);
      max += w;
      if (atsMatch(resumeText, item.keyword, item.variations).matched) score += w;
    }
  }
  return max > 0 ? Math.round((score / max) * 100) : 0;
}

// ── Keyword Extraction via Claude ─────────────────────────────────────────────

async function extractKeywords(client, jd) {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `You are an ATS parser. Parse this job description like Taleo or Greenhouse would.
Return ONLY valid JSON — no markdown, no explanation.

{
  "hardSkills": [{"keyword": "exact term", "priority": "required|preferred", "variations": ["abbrev"]}],
  "softSkills": [{"keyword": "...", "priority": "required|preferred", "variations": []}],
  "tools":      [{"keyword": "...", "priority": "required|preferred", "variations": []}],
  "education":  [{"keyword": "...", "priority": "required|preferred", "variations": []}],
  "experience": [{"keyword": "...", "priority": "required|preferred", "variations": []}],
  "certifications": []
}

RULES:
- Extract EXACT terms from the JD, not synonyms you invent
- required = Must Have / Required sections, or uses "must", "required"
- preferred = Nice to Have / Preferred sections, or uses "preferred", "plus"
- Include known abbreviations: JavaScript→["JS"], TypeScript→["TS"], AWS→["Amazon Web Services"]

Job Description:
${jd}`
    }]
  });
  const text = msg.content[0].text.trim();
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  console.log('\n' + '═'.repeat(62));
  console.log('  ATS SCORING — AI TEST WITH SYNTHETIC DATASET');
  console.log('═'.repeat(62));

  console.log('\n▶ Extracting keywords from job description via Claude Haiku...');
  const keywords = await extractKeywords(client, JOB_DESCRIPTION);

  if (!keywords) {
    console.error('✗ Keyword extraction failed — cannot continue.');
    process.exit(1);
  }

  const breakdown = Object.entries(keywords)
    .filter(([, v]) => v.length > 0)
    .map(([k, v]) => `${k}: ${v.length}`)
    .join('  |  ');
  console.log(`✓ Keywords extracted  →  ${breakdown}`);

  const requiredKws = Object.values(keywords).flat().filter(k => k.priority === 'required').map(k => k.keyword);
  const preferredKws = Object.values(keywords).flat().filter(k => k.priority === 'preferred').map(k => k.keyword);
  console.log(`  Required  : ${requiredKws.join(', ')}`);
  console.log(`  Preferred : ${preferredKws.join(', ')}`);

  console.log('\n' + '─'.repeat(62));
  console.log('  SCORING RESULTS');
  console.log('─'.repeat(62));

  let passed = 0;
  const results = [];

  for (const resume of RESUMES) {
    const score = atsScore(resume.text, keywords);
    const ok = resume.pass(score);
    if (ok) passed++;
    results.push({ name: resume.name, score, expected: resume.expected, ok });

    const icon = ok ? '✓ PASS' : '✗ FAIL';
    const bar = '█'.repeat(Math.round(score / 5)) + '░'.repeat(20 - Math.round(score / 5));
    console.log(`\n  [${icon}] ${resume.name}`);
    console.log(`    Score   : ${score}%  ${bar}`);
    console.log(`    Expected: ${resume.expected}`);
  }

  console.log('\n' + '═'.repeat(62));
  const verdict = passed === RESUMES.length ? '✓ ALL TESTS PASSED' : `✗ ${RESUMES.length - passed} TEST(S) FAILED`;
  console.log(`  ${verdict}  (${passed}/${RESUMES.length})`);
  console.log('═'.repeat(62) + '\n');

  process.exit(passed === RESUMES.length ? 0 : 1);
}

main().catch(err => { console.error(err); process.exit(1); });
